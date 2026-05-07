import cloudinary from "../lib/cloudinary.js";
import { createToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// ─── Signup ──────────────────────────────────────────────────────────────────
export const signUp = async (req, res) => {
  try {
    const { fullName, email, password, bio } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Full name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      bio: bio?.trim() || "",
    });

    const token = createToken(newUser._id);

    // Return user data without password
    const userData = newUser.toObject();
    delete userData.password;

    return res.status(201).json({
      success: true,
      userData,
      token,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during signup" });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Explicitly select password since it's excluded by default (select: false)
    const userData = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!userData) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = createToken(userData._id);

    // Return user data without password
    const userResponse = userData.toObject();
    delete userResponse.password;

    return res.json({
      success: true,
      userData: userResponse,
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
};

// ─── Check Auth ──────────────────────────────────────────────────────────────
export const checkAuth = (req, res) => {
  return res.json({ success: true, user: req.user });
};

// ─── Update Profile ──────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName, bio } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (bio !== undefined) updateData.bio = bio.trim();

    if (profilePic) {
      const upload = await cloudinary.uploader.upload(profilePic, {
        folder: "quickchat_avatars",
        transformation: [{ width: 300, height: 300, crop: "fill" }],
      });
      updateData.profilePic = upload.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      returnDocument: "after",
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};
