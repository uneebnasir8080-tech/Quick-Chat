import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
    typingUsers,
  } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const filteredUsers = input
    ? users.filter((user) =>
      user.fullName.toLowerCase().includes(input.toLowerCase())
    )
    : users;

  useEffect(() => {
    getUsers();
  }, [onlineUsers]);

  return (
    <div
      className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-auto text-white ${selectedUser ? "max-md:hidden" : ""}`}
    >
      {/* Header */}
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <img
            src={assets.logo}
            onClick={() => setSelectedUser(null)}
            alt="QuickChat"
            className="max-w-40 cursor-pointer"
          />
          <div className="relative py-2 group">
            <img
              src={assets.menu_icon}
              alt="Menu"
              className="max-h-5 cursor-pointer"
            />
            <div className="absolute space-y-3 top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block">
              <p
                onClick={() => navigate("/profile")}
                className="cursor-pointer text-sm hover:text-violet-400 transition-colors"
              >
                Edit Profile
              </p>
              <hr className="border-gray-600" />
              <p
                onClick={logout}
                className="cursor-pointer text-sm hover:text-red-400 transition-colors"
              >
                Logout
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5">
          <img src={assets.search_icon} alt="Search" className="w-3" />
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type="text"
            placeholder="Search users..."
            className="bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1"
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex flex-col gap-1">
        {filteredUsers.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-4">
            {input ? "No users found" : "No users yet"}
          </p>
        )}
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            onClick={() => {
              setSelectedUser(user);
              setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
            }}
            className={`relative flex items-center gap-2 p-2 pl-4 rounded-lg cursor-pointer max-sm:text-sm transition-colors hover:bg-[#282142]/40 ${selectedUser?._id === user._id ? "bg-[#282142]/50" : ""}`}
          >
            <div className="relative">
              <img
                src={user?.profilePic || assets.avatar_icon}
                alt={user.fullName}
                className="w-[35px] h-[35px] aspect-square rounded-full object-cover"
              />
              {/* Online indicator dot on avatar */}
              {onlineUsers?.includes(user._id) && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#1a1a2e]"></span>
              )}
            </div>
            <div className="flex flex-col leading-5 flex-1 min-w-0">
              <p className="truncate">{user.fullName}</p>
              {typingUsers.has(user._id) ? (
                <span className="text-green-400 text-xs animate-pulse">
                  typing...
                </span>
              ) : onlineUsers?.includes(user._id) ? (
                <span className="text-green-400 text-xs">Online</span>
              ) : (
                <span className="text-neutral-400 text-xs">Offline</span>
              )}
            </div>
            {unseenMessages[user._id] > 0 && (
              <span className="text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/70 text-white font-medium shrink-0">
                {unseenMessages[user._id]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
