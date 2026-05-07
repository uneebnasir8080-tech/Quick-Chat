import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    seen: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index for efficient chat queries (fetching conversation between two users)
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

// Index for unseen message count queries
messageSchema.index({ senderId: 1, receiverId: 1, seen: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;