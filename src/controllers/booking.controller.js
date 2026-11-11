
import { ObjectId } from "mongodb";
import { getDB, getMongoClient } from "../config/database.js";

const transactionOptions = {
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
  readPreference: "primary",
};

export const createBooking = async (req, res, next) => {
  const session = getMongoClient().startSession();

  try {
    const { studioId, startAt, endAt } = req.body;

    if (!studioId || !ObjectId.isValid(studioId)) {
      return res.status(400).json({
        success: false,
        message: "A valid studio ID is required",
      });
    }

    const start = new Date(startAt);
    const end = new Date(endAt);

if (
  !startAt ||
  !endAt ||
  Number.isNaN(start.getTime()) ||
  Number.isNaN(end.getTime()) ||
  start >= end ||
  start <= new Date()
) {
      return res.status(400).json({
        success: false,
        message: "Booking dates must be valid and the start time must be in the future",
      });
    }

    const db = getDB();
    const studioObjectId = new ObjectId(studioId);

    let errorResponse = null;
    let createdBooking = null;

    await session.withTransaction(async () => {
      errorResponse = null;
      createdBooking = null;

      const studio = await db.collection("studios").findOne(
        { _id: studioObjectId },
        { session }
      );

      if (!studio) {
        errorResponse = {
          status: 404,
          message: "Studio not found",
        };
        return;
      }

      if (studio.hostId === req.user.id) {
        errorResponse = {
          status: 400,
          message: "You cannot book your own studio",
        };
        return;
      }

      const lockResult = await db.collection("studios").updateOne(
        { _id: studioObjectId },
        { $inc: { bookingVersion: 1 } },
        { session }
      );

      if (lockResult.matchedCount === 0) {
        errorResponse = {
          status: 404,
          message: "Studio not found",
        };
        return;
      }

      const conflictingBooking = await db.collection("bookings").findOne(
        {
          studioId: studioObjectId,
          status: "Confirmed",
          startAt: { $lt: end },
          endAt: { $gt: start },
        },
        { session }
      );

      if (conflictingBooking) {
        errorResponse = {
          status: 409,
          message: "This studio is already booked for the selected time slot",
        };
        return;
      }

      const duration =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      const booking = {
        studioId: studioObjectId,
        studioTitle: studio.title,
        studioImage: studio.image,
        studioCategory: studio.category,
        location: studio.location,
        hostId: studio.hostId,
        hostName: studio.hostName,
        hostEmail: studio.hostEmail,
        renterId: req.user.id,
        renterName: req.user.name,
        renterEmail: req.user.email,
        startAt: start,
        endAt: end,
        hourlyRate: Number(studio.hourlyRate),
        totalPrice: duration * Number(studio.hourlyRate),
        status: "Pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("bookings").insertOne(
        booking,
        { session }
      );

      createdBooking = {
        _id: result.insertedId,
        ...booking,
      };
    }, transactionOptions);

    if (errorResponse) {
      return res.status(errorResponse.status).json({
        success: false,
        message: errorResponse.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Booking request submitted successfully",
      data: createdBooking,
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const db = getDB();

    const bookings = await db.collection("bookings")
      .aggregate([
        {
          $match: {
            $or: [
              { renterId: req.user.id },
              { hostId: req.user.id },
            ],
          },
        },
        {
          $lookup: {
            from: "studios",
            localField: "studioId",
            foreignField: "_id",
            as: "studio",
          },
        },
        {
          $unwind: {
            path: "$studio",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            studioCategory: {
              $ifNull: ["$studioCategory", "$studio.category"],
            },
            location: {
              $ifNull: ["$location", "$studio.location"],
            },
            studioImage: {
              $ifNull: ["$studioImage", "$studio.image"],
            },
            studioTitle: {
              $ifNull: ["$studioTitle", "$studio.title"],
            },
            totalPrice: {
              $ifNull: [
                "$totalPrice",
                {
                  $multiply: [
                    "$hourlyRate",
                    {
                      $divide: [
                        { $subtract: ["$endAt", "$startAt"] },
                        3600000,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          $project: {
            studio: 0,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const db = getDB();

    const result = await db.collection("bookings").updateOne(
      {
        _id: new ObjectId(id),
        renterId: req.user.id,
        status: "Pending",
      },
      {
        $set: {
          status: "Cancelled",
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Pending booking not found or you are not authorized to cancel it",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  const session = getMongoClient().startSession();

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const allowedTransitions = {
      Confirmed: "Pending",
      Completed: "Confirmed",
    };

    if (!allowedTransitions[status]) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status",
      });
    }

    const db = getDB();
    let errorResponse = null;
    let updated = false;

    await session.withTransaction(async () => {
      errorResponse = null;
      updated = false;

      const booking = await db.collection("bookings").findOne(
        {
          _id: new ObjectId(id),
          hostId: req.user.id,
          status: allowedTransitions[status],
        },
        { session }
      );

      if (!booking) {
        errorResponse = {
          status: 404,
          message: "Booking not found or status transition not allowed",
        };
        return;
      }

      if (status === "Confirmed") {

        if (status === "Completed" && booking.endAt > new Date()) {
  errorResponse = {
    status: 400,
    message: "A booking cannot be completed before its scheduled end time",
  };
  return;
}
        const lockResult = await db.collection("studios").updateOne(
          { _id: booking.studioId },
          { $inc: { bookingVersion: 1 } },
          { session }
        );

        if (lockResult.matchedCount === 0) {
          errorResponse = {
            status: 404,
            message: "The studio associated with this booking no longer exists",
          };
          return;
        }

        const conflictingBooking = await db.collection("bookings").findOne(
          {
            _id: { $ne: booking._id },
            studioId: booking.studioId,
            status: "Confirmed",
            startAt: { $lt: booking.endAt },
            endAt: { $gt: booking.startAt },
          },
          { session }
        );

        if (conflictingBooking) {
          errorResponse = {
            status: 409,
            message: "Cannot confirm this booking because another confirmed booking overlaps this time slot",
          };
          return;
        }
      }

      const result = await db.collection("bookings").updateOne(
        {
          _id: booking._id,
          hostId: req.user.id,
          status: allowedTransitions[status],
        },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        },
        { session }
      );

      updated = result.modifiedCount === 1;
    }, transactionOptions);

    if (errorResponse) {
      return res.status(errorResponse.status).json({
        success: false,
        message: errorResponse.message,
      });
    }

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: "Booking status could not be updated",
      });
    }

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};
