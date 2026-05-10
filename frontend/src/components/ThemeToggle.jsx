import React, { useState, useEffect } from "react";
import { IconSun, IconMoon } from "./Icons";
import { motion } from "framer-motion";

const ThemeToggle = () => {
  const [isLight, setIsLight] = useState(
    localStorage.getItem("theme") === "light"
  );

  useEffect(() => {
    if (isLight) {
      document.body.classList.add("light-theme");
      localStorage.setItem("theme", "light");
    } else {
      document.body.classList.remove("light-theme");
      localStorage.setItem("theme", "dark");
    }
  }, [isLight]);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsLight(!isLight)}
      className="p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-colors shadow-sm"
      title="Toggle Theme"
    >
      {isLight ? <IconMoon size={20} /> : <IconSun size={20} />}
    </motion.button>
  );
};

export default ThemeToggle;
