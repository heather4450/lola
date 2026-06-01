import { createContext, useContext, useState, useEffect } from "react";

const THEMES = {
  dark: {
    name: "dark",
    bg: "#0B0B0F",
    surface: "rgba(255,255,255,0.045)",
    surfaceStrong: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,255,255,0.13)",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.65)",
    textSub: "rgba(255,255,255,0.35)",
    neonBlue: "#4DA3FF",
    neonGreen: "#30D158",
    neonRed: "#FF453A",
    neonYellow: "#FF9F0A",
    neonPurple: "#BF5AF2",
    inputBg: "rgba(255,255,255,0.05)",
    navBg: "rgba(11,11,15,0.95)",
  },
  light: {
    name: "light",
    bg: "#F2F4F8",
    surface: "rgba(255,255,255,0.90)",
    surfaceStrong: "#FFFFFF",
    border: "rgba(0,0,0,0.1)",
    borderStrong: "rgba(0,0,0,0.18)",
    // Full-opacity text for maximum contrast on white
    text: "#0D1117",
    textMuted: "#4A5568",
    textSub: "#718096",
    // Saturated accent colors that pass WCAG on white
    neonBlue: "#0062CC",
    neonGreen: "#1A7F37",
    neonRed: "#C0392B",
    neonYellow: "#996300",
    neonPurple: "#6B21A8",
    inputBg: "#FFFFFF",
    navBg: "rgba(255,255,255,0.96)",
  },
};

const ThemeContext = createContext({
  theme: THEMES.dark,
  toggleTheme: () => {},
  themeName: "dark",
});

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("binchecker_theme");
    if (saved === "light" || saved === "dark") setThemeName(saved);
  }, []);

  const toggleTheme = () => {
    const next = themeName === "dark" ? "light" : "dark";
    setThemeName(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("binchecker_theme", next);
    }
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("binchecker_token")
        : null;
    if (token) {
      fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ theme: next }),
      }).catch(() => {});
    }
  };

  return (
    <ThemeContext.Provider
      value={{ theme: THEMES[themeName], themeName, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
