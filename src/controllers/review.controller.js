
import { ObjectId } from "mongodb";
import { getDB } from "../config/database.js";

export const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "A valid booking ID is required",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5",
      });
    }

    if (
      typeof comment !== "string" ||
      comment.trim().length < 5 ||
      comment.trim().length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Review must be between 5 and 1000 characters",
      });
    }

    const db = getDB();

    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
      renterId: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or you are not authorized to review it",
      });
    }

    if (booking.status !== "Completed") {
      return res.status(403).json({
        success: false,
        message: "Only completed bookings can be reviewed",
      });
    }

    if (!booking.endAt || new Date(booking.endAt) > new Date()) {
      return res.status(403).json({
        success: false,
        message: "You can review only after the booking period has ended",
      });
    }

    const review = {
      studioId: booking.studioId,
      bookingId: booking._id,
      renterId: req.user.id,
      renterName: booking.renterName || "StudioSpace User",
      rating: numericRating,
      comment: comment.trim(),
      createdAt: new Date(),
    };

    const result = await db.collection("reviews").insertOne(review);

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: {
        _id: result.insertedId,
        ...review,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this booking",
      });
    }

    next(error);
  }
};

export const getStudioReviews = async (req, res, next) => {
  try {
    const { studioId } = req.params;

    if (!ObjectId.isValid(studioId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid studio ID",
      });
    }

    const db = getDB();
    const studioObjectId = new ObjectId(studioId);

    const reviews = await db
      .collection("reviews")
      .find(
        { studioId: studioObjectId },
        {
          projection: {
            renterId: 0,
            bookingId: 0,
          },
        }
      )
      .sort({ createdAt: -1 })
      .toArray();

    const summary = await db
      .collection("reviews")
      .aggregate([
        {
          $match: {
            studioId: studioObjectId,
          },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 },
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        summary: {
          averageRating: summary[0]?.averageRating ?? null,
          reviewCount: summary[0]?.reviewCount ?? 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReviews = async (req, res, next) => {
  try {
    const db = getDB();

    const reviews = await db
      .collection("reviews")
      .find(
        { renterId: req.user.id },
        {
          projection: {
            _id: 0,
            bookingId: 1,
          },
        }
      )
      .toArray();

    return res.status(200).json({
      success: true,
      data: reviews.map((review) => review.bookingId.toString()),
    });
  } catch (error) {
    next(error);
  }
};
