
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

export const getStudioById = async (req, res, next) => {
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
