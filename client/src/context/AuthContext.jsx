import { createContext, useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Configure axios defaults
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const socketRef = useRef(null);

  // ─── Set axios auth header whenever token changes ──────────────────────────
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Keep legacy header for backward compat during migration
      axios.defaults.headers.common["token"] = token;
    } else {
      delete axios.defaults.headers.common["Authorization"];
      delete axios.defaults.headers.common["token"];
    }
  }, [token]);

  // ─── Check if user is already authenticated on mount ───────────────────────
  const checkAuth = useCallback(async () => {
    if (!token) {
      setIsCheckingAuth(false);
      return;
    }
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      } else {
        // Token is invalid, clean up
        localStorage.removeItem("token");
        setToken(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error.message);
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setIsCheckingAuth(false);
    }
  }, [token]);

  useEffect(() => {
    checkAuth();
    // Cleanup socket on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // ─── Login / Signup ────────────────────────────────────────────────────────
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        connectSocket(data.userData);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
    }
  };

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("token");
    setAuthUser(null);
    setOnlineUsers([]);
    setToken(null);
    toast.success("Logged out successfully");

    // Safe disconnect — check if socket exists
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // ─── Update Profile ────────────────────────────────────────────────────────
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
        return true;
      }
      toast.error(data.message);
      return false;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      return false;
    }
  };

  // ─── Socket Connection ────────────────────────────────────────────────────
  const connectSocket = (userData) => {
    if (!userData || socketRef.current?.connected) return;

    const currentToken = localStorage.getItem("token");

    const newSocket = io(backendUrl, {
      auth: { token: currentToken },
      query: { userId: userData._id },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    newSocket.on("getOnlineUser", (userIds) => {
      setOnlineUsers(userIds);
    });

    socketRef.current = newSocket;
  };

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket: socketRef.current,
    token,
    isCheckingAuth,
    login,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
