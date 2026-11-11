
import express from "express";
import {
  createReview,
  getStudioReviews,
  getMyReviews,
} from "../controllers/review.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/my-reviews", verifyJWT, getMyReviews);
router.get("/studio/:studioId", getStudioReviews);
router.post("/", verifyJWT, createReview);

export default router;
