
import express from "express";
import cors from "cors";
import reviewRoutes from "./routes/review.routes.js";
import cookieParser from "cookie-parser";
import studioRoutes from "./routes/studio.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import { toNodeHandler } from "better-auth/node";
import { getAuth } from "./auth/auth.js";
import {
  notFound,
  errorHandler,
} from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.all("/api/auth/*splat", (req, res) => {
  return toNodeHandler(getAuth())(req, res);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "StudioSpace API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/studios", studioRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/uploads", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
