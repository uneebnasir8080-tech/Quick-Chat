import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatTime, compressImage } from "../lib/utils";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
    isMessagesLoading,
    hasMoreMessages,
    loadMoreMessages,
    typingUsers,
    emitTyping,
    emitStopTyping,
  } = useContext(ChatContext);

  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const isSelectedUserTyping =
    selectedUser && typingUsers.has(selectedUser._id);

  // ─── Send text message ────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "" || isSending) return;

    setIsSending(true);
    emitStopTyping();
    await sendMessage({ text: input.trim() });
    setInput("");
    setIsSending(false);
  };

  // ─── Send image with compression ──────────────────────────────────────────
  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setIsSending(true);
    try {
      const compressed = await compressImage(file);
      await sendMessage({ image: compressed });
    } catch (error) {
      toast.error("Failed to send image");
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ─── Typing indicator on input change ─────────────────────────────────────
  const handleInputChange = (e) => {
    setInput(e.target.value);
    emitTyping();
  };

  // ─── Fetch messages when selecting a user ─────────────────────────────────
  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  // ─── Auto-scroll to bottom on new messages ────────────────────────────────
  useEffect(() => {
    if (scrollEndRef.current && messages.length > 0) {
      scrollEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ─── Infinite scroll: load older messages on scroll to top ────────────────
  const handleScroll = () => {
    if (!chatContainerRef.current || !hasMoreMessages) return;
    if (chatContainerRef.current.scrollTop === 0) {
      const prevHeight = chatContainerRef.current.scrollHeight;
      loadMoreMessages().then(() => {
        // Maintain scroll position after prepending old messages
        requestAnimationFrame(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight - prevHeight;
          }
        });
      });
    }
  };

  // ─── Loading skeleton ─────────────────────────────────────────────────────
  const MessageSkeleton = () => (
    <div className="flex flex-col gap-4 p-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`flex items-end gap-2 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}
        >
          <div className="w-7 h-7 rounded-full bg-white/10"></div>
          <div
            className={`h-8 rounded-lg bg-white/10 ${i % 3 === 0 ? "w-48" : i % 3 === 1 ? "w-32" : "w-40"}`}
          ></div>
        </div>
      ))}
    </div>
  );

  // ─── Selected user view ───────────────────────────────────────────────────
  if (selectedUser) {
    return (
      <div className="h-full overflow-hidden relative backdrop-blur-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500 shrink-0">
          <img
            src={selectedUser. || assets.avatar_icon}
            alt={selectedUser.fullName}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-lg text-white flex items-center gap-2 truncate">
              {selectedUser.fullName}
              {onlineUsers.includes(selectedUser._id) && (
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              )}
            </p>
            {isSelectedUserTyping && (
              <p className="text-xs text-green-400 animate-pulse">typing...</p>
            )}
          </div>
          <img
            onClick={() => setSelectedUser(null)}
            src={assets.arrow_icon}
            alt="Back"
            className="md:hidden max-w-7 cursor-pointer"
          />
          <img
            src={assets.help_icon}
            alt="Help"
            className="max-md:hidden max-w-5"
          />
        </div>

        {/* Chat area */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto chat-container p-3 pb-6"
        >
          {isMessagesLoading ? (
            <MessageSkeleton />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-sm">No messages yet. Say hello! 👋</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && "flex-row-reverse"}`}
              >
                {msg.image ? (
                  <img
                    src={msg.image}
                    className="max-w-57.5 border border-gray-700 rounded-lg overflow-hidden mb-8"
                    alt="Shared image"
                  />
                ) : (
                  <p
                    className={`p-2 max-w-[220px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${msg.senderId === authUser._id ? "rounded-br-none" : "rounded-bl-none"}`}
                  >
                    {msg.text}
                  </p>
                )}
                <div className="text-center text-xs">
                  <img
                    src={
                      msg.senderId === authUser._id
                        ? authUser?. || assets.avatar_icon
                        : selectedUser?. || assets.avatar_icon
                    }
                    className="w-7 h-7 rounded-full object-cover"
                    alt=""
                  />
                  <p className="text-gray-500">{formatTime(msg.createdAt)}</p>
                  {/* Read receipt for sent messages */}
                  {msg.senderId === authUser._id && (
                    <p className={`text-[10px] ${msg.seen ? "text-blue-400" : "text-gray-600"}`}>
                      {msg.seen ? "✓✓" : "✓"}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={scrollEndRef}></div>
        </div>

        {/* Bottom input area */}
        <div className="shrink-0 flex items-center gap-3 p-3 border-t border-stone-500/30">
          <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
            <input
              type="text"
              onChange={handleInputChange}
              value={input}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) handleSendMessage(e);
              }}
              onBlur={emitStopTyping}
              placeholder="Send a message"
              className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400 bg-transparent"
              disabled={isSending}
            />
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleSendImage}
              accept="image/png, image/jpeg, image/webp"
              hidden
              id="image"
            />
            <label htmlFor="image" className={isSending ? "opacity-50 pointer-events-none" : ""}>
              <img
                src={assets.gallery_icon}
                className="w-5 mr-2 cursor-pointer"
                alt="Send image"
              />
            </label>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={isSending || input.trim() === ""}
            className="disabled:opacity-40"
          >
            <img
              src={assets.send_button}
              className="w-7 cursor-pointer"
              alt="Send"
            />
          </button>
        </div>
      </div>
    );
  }

  // ─── No user selected placeholder ─────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo_icon} alt="QuickChat" className="max-w-16" />
      <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
      <p className="text-sm text-gray-400">Select a conversation to start messaging</p>
    </div>
  );
};

export default ChatContainer;