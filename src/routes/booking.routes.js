
import express from "express";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  updateBookingStatus,
} from "../controllers/booking.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, createBooking);
router.get("/my-bookings", verifyJWT, getMyBookings);
router.patch("/:id/cancel", verifyJWT, cancelBooking);
router.patch("/:id/status", verifyJWT, updateBookingStatus);

export default router;
