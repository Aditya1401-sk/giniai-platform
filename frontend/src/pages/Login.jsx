import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { IconMail, IconLock, IconLogIn, IconShield, IconSparkles, IconZap, IconEye, IconEyeOff } from "../components/Icons";
import ThemeToggle from "../components/ThemeToggle";
import { API_BASE_URL } from "../config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showWakeUpMessage, setShowWakeUpMessage] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowWakeUpMessage(false);
    const wakeUpTimer = setTimeout(() => setShowWakeUpMessage(true), 3000);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });
      clearTimeout(wakeUpTimer);
      setShowWakeUpMessage(false);

      const role = response.data.role.toLowerCase();
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("role", role);
      localStorage.setItem("email", email);
      localStorage.setItem("name", response.data.name || "User");
      localStorage.setItem("profile_pic", response.data.profile_pic || "");
      sessionStorage.setItem("just_logged_in", "true");
      
      if (role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = `/${role}`;
      }
    } catch (error) {
      alert("Login Failed: Please check your credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setShowWakeUpMessage(false);
    const wakeUpTimer = setTimeout(() => setShowWakeUpMessage(true), 3000);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/google`, {
        credential: credentialResponse.credential
      });
      clearTimeout(wakeUpTimer);
      setShowWakeUpMessage(false);

      const role = response.data.role.toLowerCase();
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("role", role);
      localStorage.setItem("email", response.data.email || "google-user"); 
      localStorage.setItem("name", response.data.name || "User");
      localStorage.setItem("profile_pic", response.data.profile_pic || "");
      sessionStorage.setItem("just_logged_in", "true");

      window.location.href = `/${role}`;
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Google Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 relative font-sans">
      {/* THEME TOGGLE */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[420px] solid-card p-8 z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] mb-6">
            <IconZap className="text-[var(--accent-primary)]" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">
            GiniLytics
          </h1>
          <p className="text-[var(--text-secondary)] text-sm font-medium">
            Enterprise Intelligence Platform
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <div className="relative group">
              <IconMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-primary)] transition-colors" size={18} />
              <input
                type="email"
                placeholder="Work Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg py-3 pl-12 pr-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all placeholder-[var(--text-secondary)] text-sm"
              />
            </div>
          </div>

          <div>
            <div className="relative group">
              <IconLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-primary)] transition-colors" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Security Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg py-3 pl-12 pr-12 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all placeholder-[var(--text-secondary)] text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--accent-primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--accent-hover)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <IconLogIn size={16} />
                </>
              )}
            </button>
            
            {showWakeUpMessage && loading && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-amber-500 font-medium text-center bg-amber-500/5 py-2 rounded-lg border border-amber-500/10"
              >
                ⚡ Server is waking up from idle, please wait a moment...
              </motion.p>
            )}
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-color)]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--bg-primary)] px-4 text-[var(--text-secondary)] font-medium">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert("Google Login Failed")}
              theme="filled_black"
              shape="pill"
              width="100%"
            />
          </div>
        </form>

        <div className="mt-8 flex justify-between items-center px-2 pt-6 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <IconShield size={14} /> Secure Access
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <IconSparkles size={14} /> AI Engine Active
          </div>
        </div>
      </motion.div>
    </div>
  );
}