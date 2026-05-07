import mongoose from "mongoose";

/**
 * Connect to MongoDB with proper error handling.
 * Throws on failure so the server won't start with a broken DB connection.
 */
export const connectDb = async () => {
  mongoose.connection.on("connected", () => {
    console.log("✅ Database connected successfully");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ Database connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ Database disconnected");
  });

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
};