import React from "react";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <div className="text-center p-10 backdrop-blur-xl bg-white/5 border border-gray-700 rounded-2xl max-w-md mx-4">
        <div className="text-7xl font-bold bg-gradient-to-r from-purple-400 to-violet-600 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-xl font-semibold text-white mb-3">
          Page not found
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-full text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
