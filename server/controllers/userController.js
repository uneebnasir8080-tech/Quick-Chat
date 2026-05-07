import cloudinary from "../lib/cloudinary.js";
import { createToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// signup controller
export const signUp = async (req, res) => {
  const { fullName, email, password, bio } = req.body;
  try {
    if (!fullName || !email || !password || !bio) {
      return res.json({ success: false, message: "Missing Details" });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.json({ success: false, message: "User already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
    });
    const token = createToken(newUser._id);

    return res.json({
      success: true,
      userData: newUser,
      token,
      message: "User created",
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// login controller
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    const userData = await User.findOne({ email });
    if (!userData) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isPassword = await bcrypt.compare(password, userData.password);
    if (!isPassword) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken(userData._id);

    return res.json({
      success: true,
      userData,
      token,
      message: "Login successfull",
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// get user data after Authentice
export const checkaAuth = (req, res) => {
  return res.json({ success: true, user: req.user });
};

// update profile

export const updateProfile = async (req, res) => {
  const { profilePic, fullName, bio } = req.body;

  try {

    const userId = req.user._id;
    const userData= await User.findById(userId)
    let updatedUser;
    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { fullName, bio },
        {  returnDocument: 'after',
  runValidators: true, },
      );
    } else {
      const upload = cloudinary.uploader.upload(profilePic);
      const url=  (await upload).secure_url
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { ProfilePic:url, fullName, bio },
        { returnDocument: 'after',
  runValidators: true,},
      );
    }
    return res.json({success:true, user:updatedUser})
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};
