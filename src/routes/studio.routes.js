
import express from "express";
import {
  getAllStudios,
  getStudioById,
} from "../controllers/studio.controller.js";

const router = express.Router();

router.get("/", getAllStudios);
router.get("/:id", getStudioById);

export default router;
