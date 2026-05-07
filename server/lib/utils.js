import jwt from "jsonwebtoken";

/**
 * Create a JWT token with proper payload structure and expiration.
 * @param {string} userId - MongoDB user ID
 * @returns {string} Signed JWT token
 */
export const createToken = (userId) => {
  const token = jwt.sign(
    { userId: userId.toString() },
    process.env.SECRET,
    { expiresIn: "7d" }
  );
  return token;
};