
import express from "express";
import {
  imageUpload,
  uploadStudioImage,
} from "../controllers/upload.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, imageUpload, uploadStudioImage);

export default router;
