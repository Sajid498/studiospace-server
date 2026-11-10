
import express from "express";
import {
  getAllStudios,
  getStudioById,
  createStudio,
} from "../controllers/studio.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllStudios);
router.get("/:id", getStudioById);
router.post("/", verifyJWT, createStudio);

export default router;
