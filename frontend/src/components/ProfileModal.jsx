import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function ProfileModal({ onClose }) {
  const email = localStorage.getItem("email") || "";
  const defaultName = email.split("@")[0];
  const [displayName, setDisplayName] = useState(defaultName);
  const [username, setUsername] = useState(defaultName);
  const [profilePic, setProfilePic] = useState(localStorage.getItem("profile_pic") || "");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("email", email);

    setUploading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/upload-profile-pic?email=` + email, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const newUrl = response.data.url;
      setProfilePic(newUrl);
      localStorage.setItem("profile_pic", newUrl);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  const initials = displayName
    .split(/[\s_]+/)
    .filter(Boolean)
    .map(w => w[0]?.toUpperCase())
    .join("")
    .substring(0, 2) || "U";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.18 }}
        className="relative z-10 w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Edit profile</h2>

          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-[var(--bg-tertiary)] border-2 border-[var(--border-color)] flex items-center justify-center text-3xl font-bold text-[var(--text-primary)] overflow-hidden">
                {profilePic ? (
                  <img src={profilePic.startsWith('http') ? profilePic : `${API_BASE_URL}${profilePic}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors shadow-md"
                title="Change photo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
              <input 
                ref={fileRef} 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] transition-colors outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] transition-colors outline-none"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1.5">Your profile helps people recognize you in group chats.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-xl hover:bg-[var(--accent-hover)] transition-colors"
            >
              {saved ? "✓ Saved!" : "Save"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
