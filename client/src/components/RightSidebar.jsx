import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";

const RightSidebar = () => {
  const { selectedUser, messages } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);
  const [msgImages, setMsgImages] = useState([]);

  // Extract all images from messages
  useEffect(() => {
    setMsgImages(messages.filter((msg) => msg.image).map((msg) => msg.image));
  }, [messages]);

  if (!selectedUser) return null;

  return (
    <div
      className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-auto chat-container ${selectedUser ? "max-md:hidden" : ""}`}
    >
      {/* User Info */}
      <div className="pt-8 flex flex-col items-center gap-2 text-xs font-light mx-auto">
        <img
          src={selectedUser?.profilePic || assets.avatar_icon}
          alt={selectedUser.fullName}
          className="w-20 h-20 aspect-square rounded-full object-cover"
        />
        <h1 className="px-10 text-lg font-medium mx-auto flex items-center gap-2">
          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
          )}
          {selectedUser.fullName}
        </h1>
        <p className="px-10 mx-auto text-center text-gray-400">
          {selectedUser.bio || "No bio available"}
        </p>
      </div>
      <hr className="border-[#ffffff50] my-4" />

      {/* Shared Media */}
      <div className="px-5 text-xs">
        <p className="font-medium text-gray-300 mb-2">
          Media ({msgImages.length})
        </p>
        {msgImages.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No shared media yet</p>
        ) : (
          <div className="mt-2 max-h-55 overflow-y-auto chat-container grid grid-cols-2 gap-3 opacity-80">
            {msgImages.map((url, index) => (
              <div
                key={`media-${index}`}
                onClick={() => window.open(url)}
                className="cursor-pointer rounded-md overflow-hidden hover:opacity-100 transition-opacity"
              >
                <img
                  src={url}
                  className="h-full w-full object-cover rounded-md"
                  alt={`Shared media ${index + 1}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer hover:opacity-90 transition-opacity"
      >
        Logout
      </button>
    </div>
  );
};

export default RightSidebar;