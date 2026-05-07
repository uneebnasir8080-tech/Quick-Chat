import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../context/AuthContext";
import { compressImage } from "../lib/utils";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);
  const [selectedImg, setSelectedImage] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const [name, setName] = useState(authUser?.fullName || "");
  const [bio, setBio] = useState(authUser?.bio || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      let profileData = { fullName: name.trim(), bio: bio.trim() };

      if (selectedImg) {
        const compressed = await compressImage(selectedImg, 300, 0.8);
        profileData.profilePic = compressed;
      }

      const success = await updateProfile(profileData);
      if (success) {
        navigate("/");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  // Preview image: selected file > current profile pic > default icon
  const previewSrc = selectedImg
    ? URL.createObjectURL(selectedImg)
    : authUser?.profilePic || assets.logo_icon;

  return (
    <div className="min-h-screen bg-cover bg-no-repeat flex items-center justify-center">
      <div className="w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 p-10 flex-1"
        >
          <h3 className="text-lg font-medium">Profile details</h3>

          <label
            htmlFor="avatar"
            className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors"
          >
            <input
              type="file"
              id="avatar"
              hidden
              accept=".png,.jpg,.jpeg,.webp"
              onChange={(e) => setSelectedImage(e.target.files[0])}
            />
            <img
              src={
                selectedImg
                  ? URL.createObjectURL(selectedImg)
                  : assets.avatar_icon
              }
              className={`w-12 h-12 object-cover ${selectedImg ? "rounded-full" : ""}`}
              alt="Avatar"
            />
            Upload profile image
          </label>

          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            required
            placeholder="Your name"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 bg-transparent"
          />

          <textarea
            rows={4}
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            required
            maxLength={200}
            placeholder="Write profile bio"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 bg-transparent resize-none"
          ></textarea>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex-1 py-2 border border-gray-500 text-gray-400 rounded-full text-lg cursor-pointer hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 bg-gradient-to-r from-purple-400 to-violet-600 text-white py-2 rounded-full text-lg cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Saving..." : "Save"}
            </button>
          </div>
        </form>

        <img
          src={previewSrc}
          className="max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 object-cover"
          alt="Profile preview"
        />
      </div>
    </div>
  );
};

export default ProfilePage;