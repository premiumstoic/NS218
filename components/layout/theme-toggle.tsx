"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage and system preference
    const stored = localStorage.getItem("theme");
    if (stored) {
      const darkMode = stored === "dark";
      setIsDark(darkMode);
      applyTheme(darkMode);
    } else {
      // Use system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
      applyTheme(prefersDark);
    }
  }, []);

  function applyTheme(dark: boolean) {
    const html = document.documentElement;
    if (dark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }

  function toggleTheme() {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    applyTheme(newDarkMode);
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
  }

  if (!mounted) {
    return null;
  }

  return (
    <button
      className="secondary"
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{ padding: "0.35rem 0.5rem" }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
