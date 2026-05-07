import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;
const userSocketMap = {}; // { userId: socketId }

/**
 * Initialize Socket.io with authentication and event handlers.
 * Extracted from server.js to eliminate circular dependency risk.
 */
function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "https://quick-chat-me.vercel.app/",
      credentials: true,
    },
  });

  // Socket authentication middleware — verify JWT before allowing connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = jwt.verify(token, process.env.SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log("User connected:", userId);

    if (userId) userSocketMap[userId] = socket.id;

    // Broadcast updated online users list
    io.emit("getOnlineUser", Object.keys(userSocketMap));

    // Typing indicator events
    socket.on("typing", ({ to }) => {
      const receiverSocketId = userSocketMap[to];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", { from: userId });
      }
    });

    socket.on("stopTyping", ({ to }) => {
      const receiverSocketId = userSocketMap[to];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userStopTyping", { from: userId });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", userId);
      delete userSocketMap[userId];
      io.emit("getOnlineUser", Object.keys(userSocketMap));
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

function getReceiverSocketId(userId) {
  return userSocketMap[userId] || null;
}

export { initializeSocket, getIO, getReceiverSocketId, userSocketMap };
