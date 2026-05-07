import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Protect routes by verifying JWT Bearer token.
 * Attaches authenticated user to req.user (without password).
 */
export const protectRoute = async (req, res, next) => {
  try {
    // Support both Bearer token (standard) and legacy custom header
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.headers.token) {
      // Backward compatibility with old clients
      token = req.headers.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.SECRET);

    // Handle both new format { userId: "..." } and legacy raw string tokens
    const userId = typeof decoded === "object" ? decoded.userId : decoded;

    // password is already excluded via select:false in schema,
    // but we add explicit -password as a safety net
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired, please login again" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    return res.status(500).json({ success: false, message: "Authentication failed" });
  }
};