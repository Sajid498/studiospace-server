
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import studioRoutes from "./routes/studio.routes.js";
import { toNodeHandler } from "better-auth/node";
import { getAuth } from "./auth/auth.js";

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

export default app;
