
import { ObjectId } from "mongodb";
import { getDB } from "../config/database.js";

export const getAllStudios = async (req, res, next) => {
  try {
    const db = getDB();
    const studios = await db.collection("studios").find({}).sort({ createdAt: -1 }).toArray();

    res.status(200).json({
      success: true,
      count: studios.length,
      data: studios,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudioById = async (req, res, next) => 
    {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid studio ID",
      });
    }

    const db = getDB();
    const studio = await db.collection("studios").findOne({
      _id: new ObjectId(id),
    });

    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found",
      });
    }

    res.status(200).json({
      success: true,
      data: studio,
    });
  } catch (error) {
    next(error);
  }
};



export const createStudio = async (req, res, next) => {
  try {
    const {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      image,
      amenities,
      overview,
    } = req.body;

    const requiredFields = {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      image,
      overview,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => value === undefined || value === null || String(value).trim() === "")
      .map(([field]) => field);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
        missingFields,
      });
    }

    const rate = Number(hourlyRate);
    const deposit = Number(securityDeposit);
    const capacity = Number(maxCapacity);

    if (!Number.isFinite(rate) || rate <= 0) {
      return res.status(400).json({
        success: false,
        message: "Hourly rate must be greater than zero",
      });
    }

    if (!Number.isFinite(deposit) || deposit < 0) {
      return res.status(400).json({
        success: false,
        message: "Security deposit cannot be negative",
      });
    }

    if (!Number.isInteger(capacity) || capacity < 1) {
      return res.status(400).json({
        success: false,
        message: "Maximum capacity must be a positive integer",
      });
    }

    if (!Array.isArray(amenities)) {
      return res.status(400).json({
        success: false,
        message: "Amenities must be an array",
      });
    }

    const studio = {
      title: title.trim(),
      category: category.trim(),
      hourlyRate: rate,
      securityDeposit: deposit,
      maxCapacity: capacity,
      location: location.trim(),
      image: image.trim(),
      amenities,
      overview: overview.trim(),
      hostId: req.user.id,
      hostName: req.user.name,
      hostEmail: req.user.email.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = getDB();
    const result = await db.collection("studios").insertOne(studio);

    res.status(201).json({
      success: true,
      message: "Studio created successfully",
      data: {
        _id: result.insertedId,
        ...studio,
      },
    });
  } catch (error) {
    next(error);
  }
};
