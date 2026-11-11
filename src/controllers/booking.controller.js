
import { ObjectId } from "mongodb";
import { getDB } from "../config/database.js";

export const createBooking = async (req, res, next) => {
  try {
    const {
      studioId,
      startAt,
      endAt,
    } = req.body;

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
      start >= end
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid booking start and end time are required",
      });
    }

    const db = getDB();

    const studio = await db.collection("studios").findOne({
      _id: new ObjectId(studioId),
    });

    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found",
      });
    }

    if (studio.hostId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot book your own studio",
      });
    }


const conflictingBooking = await db.collection("bookings").findOne({
  studioId: new ObjectId(studioId),
  status: "Confirmed",
  startAt: { $lt: end },
  endAt: { $gt: start },
});

if (conflictingBooking) {
  return res.status(409).json({
    success: false,
    message: "This studio is already booked for the selected time slot",
  });
}


const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

const booking = {
  studioId: new ObjectId(studioId),
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

    const result = await db.collection("bookings").insertOne(booking);

    res.status(201).json({
      success: true,
      message: "Booking request submitted successfully",
      data: {
        _id: result.insertedId,
        ...booking,
      },
    });
  } catch (error) {
    next(error);
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

    const result = await db.collection("bookings").updateOne(
      {
        _id: new ObjectId(id),
        hostId: req.user.id,
        status: allowedTransitions[status],
      },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or status transition not allowed",
      });
    }

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};
