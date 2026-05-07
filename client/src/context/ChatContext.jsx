import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());

  const { socket, axios } = useContext(AuthContext);
  const abortControllerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ─── Fetch all users for sidebar ──────────────────────────────────────────
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      console.error("Get users error:", error.message);
    }
  };

  // ─── Fetch messages — with abort for instant chat switching ────────────────
  const getMessages = useCallback(async (userId) => {
    // Cancel any in-flight request immediately
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear old messages IMMEDIATELY so user never sees stale chat
    setMessages([]);
    setHasMoreMessages(false);
    setIsMessagesLoading(true);

    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const { data } = await axios.get(`/api/messages/${userId}`, {
        signal: controller.signal,
      });

      // Only update if this request wasn't aborted
      if (!controller.signal.aborted && data.success) {
        setMessages(data.messages);
        setHasMoreMessages(data.hasMore || false);
      }
    } catch (error) {
      if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
        console.error("Get messages error:", error.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsMessagesLoading(false);
      }
    }
  }, [axios]);

  // ─── Load older messages (pagination) ──────────────────────────────────────
  const loadMoreMessages = async () => {
    if (!selectedUser || messages.length === 0 || !hasMoreMessages) return;

    const oldestMessageId = messages[0]._id;
    try {
      const { data } = await axios.get(
        `/api/messages/${selectedUser._id}?before=${oldestMessageId}&limit=50`
      );
      if (data.success) {
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMoreMessages(data.hasMore || false);
      }
    } catch (error) {
      console.error("Load more error:", error.message);
    }
  };

  // ─── Send message ─────────────────────────────────────────────────────────
  const sendMessage = async (messageData) => {
    if (!selectedUser) return;
    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );
      if (data.success) {
        setMessages((prev) => [...prev, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
    }
  };

  // ─── Typing indicators ────────────────────────────────────────────────────
  const emitTyping = () => {
    if (!socket || !selectedUser) return;
    socket.emit("typing", { to: selectedUser._id });

    // Auto-stop typing after 2 seconds of inactivity
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { to: selectedUser._id });
    }, 2000);
  };

  const emitStopTyping = () => {
    if (!socket || !selectedUser) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("stopTyping", { to: selectedUser._id });
  };

  // ─── Socket event subscriptions ───────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        // Message is from the currently open chat — mark as seen
        newMessage.seen = true;
        setMessages((prev) => [...prev, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        // Message from someone else — increment unseen count
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    };

    const handleMessagesSeen = ({ by }) => {
      // All our messages to this user were marked as seen
      if (selectedUser && by === selectedUser._id) {
        setMessages((prev) =>
          prev.map((msg) => (msg.seen ? msg : { ...msg, seen: true }))
        );
      }
    };

    const handleUserTyping = ({ from }) => {
      setTypingUsers((prev) => new Set(prev).add(from));
    };

    const handleUserStopTyping = ({ from }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(from);
        return next;
      });
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStopTyping", handleUserStopTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesSeen", handleMessagesSeen);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStopTyping", handleUserStopTyping);
    };
  }, [socket, selectedUser]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const value = {
    messages,
    users,
    selectedUser,
    unseenMessages,
    isMessagesLoading,
    hasMoreMessages,
    typingUsers,
    getUsers,
    getMessages,
    loadMoreMessages,
    sendMessage,
    setSelectedUser,
    setUnseenMessages,
    emitTyping,
    emitStopTyping,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
