import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getIO, getReceiverSocketId } from "../lib/socket.js";

// ─── Get All Users (except self) with unseen message counts ──────────────────
export const allUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");

    // Efficient aggregation for unseen message counts instead of N+1 queries
    const unseenCounts = await Message.aggregate([
      {
        $match: {
          receiverId: userId,
          seen: false,
        },
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 },
        },
      },
    ]);

    const unseenMessages = {};
    unseenCounts.forEach((item) => {
      unseenMessages[item._id.toString()] = item.count;
    });

    return res.json({ success: true, users: filteredUsers, unseenMessages });
  } catch (error) {
    console.error("Get users error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// ─── Get Messages (with cursor-based pagination) ─────────────────────────────
export const getMessage = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;
    const { before, limit = 50 } = req.query;

    const query = {
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    };

    // Cursor-based pagination: fetch messages before a given ID
    if (before) {
      query._id = { $lt: before };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Reverse so oldest messages come first for display
    messages.reverse();

    // Mark received messages as seen
    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId, seen: false },
      { seen: true }
    );

    // Notify sender that their messages have been read
    const senderSocketId = getReceiverSocketId(selectedUserId);
    if (senderSocketId) {
      getIO().to(senderSocketId).emit("messagesSeen", { by: myId.toString() });
    }

    const hasMore = messages.length === parseInt(limit);

    return res.json({ success: true, messages, hasMore });
  } catch (error) {
    console.error("Get messages error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
};

// ─── Mark Message as Seen ────────────────────────────────────────────────────
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findByIdAndUpdate(id, { seen: true }, { new: true });
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Notify the sender that their message was seen
    const senderSocketId = getReceiverSocketId(message.senderId.toString());
    if (senderSocketId) {
      getIO().to(senderSocketId).emit("messageSeen", { messageId: id });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Mark seen error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to mark message as seen" });
  }
};

// ─── Send Message ────────────────────────────────────────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ success: false, message: "Message must contain text or an image" });
    }

    let imageUrl;
    if (image) {
      const upload = await cloudinary.uploader.upload(image, {
        folder: "quickchat_messages",
      });
      imageUrl = upload.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: text?.trim(),
      image: imageUrl,
    });

    // Emit new message to receiver via socket
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      getIO().to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json({ success: true, newMessage });
  } catch (error) {
    console.error("Send message error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to send message" });
  }
};