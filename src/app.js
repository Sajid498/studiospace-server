
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import studioRoutes from "./routes/studio.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

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
