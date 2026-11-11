
import { MongoClient } from "mongodb";
import dns from "node:dns";

let client;
let db;

// Workaround for local DNS resolver refusing MongoDB SRV queries.
// Production will use its normal DNS configuration.
if (process.env.NODE_ENV === "development") {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

export const connectDB = async () => {
  try {
    if (db) return db;

    const uri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME || "studiospace";

    if (!uri) {
      throw new Error("MONGODB_URI is missing from environment variables");
    }

    client = new MongoClient(uri);

    await client.connect();

    db = client.db(dbName);

    await db.command({ ping: 1 });

    await Promise.all([

      db.collection("reviews").createIndex(
  { bookingId: 1 },
  { unique: true }
),
db.collection("reviews").createIndex({
  studioId: 1,
  createdAt: -1,
}),
  db.collection("studios").createIndex({ createdAt: -1 }),
  db.collection("studios").createIndex({ hostId: 1 }),
  db.collection("bookings").createIndex({
    studioId: 1,
    status: 1,
    startAt: 1,
    endAt: 1,
  }),
  db.collection("bookings").createIndex({ renterId: 1, createdAt: -1 }),
  db.collection("bookings").createIndex({ hostId: 1, createdAt: -1 }),
]);

    console.log(`MongoDB connected successfully: ${dbName}`);

    return db;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export const getDB = () => {
  if (!db) {
    throw new Error("Database is not connected yet");
  }

  return db;
};

export const closeDB = async () => {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
};
export const getMongoClient = () => {
  if (!client) {
    throw new Error("MongoDB client is not connected yet");
  }

  return client;
};