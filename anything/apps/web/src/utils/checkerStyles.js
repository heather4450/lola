// Dark palette (default / backward compat)
export const C = {
  bg: "#0B0B0F",
  card: "rgba(255,255,255,0.045)",
  border: "rgba(255,255,255,0.08)",
  blue: "#4DA3FF",
  green: "#30D158",
  red: "#FF453A",
  yellow: "#FF9F0A",
  text: "#FFFFFF",
  sub: "rgba(255,255,255,0.65)",
  muted: "rgba(255,255,255,0.42)",
};

// Light palette
export const LIGHT_C = {
  bg: "#F0F2F5",
  card: "rgba(255,255,255,0.94)",
  border: "rgba(0,0,0,0.10)",
  blue: "#0062CC",
  green: "#15803D",
  red: "#B91C1C",
  yellow: "#92400E",
  text: "#0D1117",
  sub: "#374151",
  muted: "#6B7280",
};

/** Return the correct palette for a given theme object */
export function getC(theme) {
  return theme?.name === "light" ? LIGHT_C : C;
}

/** Build a glass-morphism style object using a given palette */
export function getGlass(palette, extra = {}) {
  return {
    background: palette.card,
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: `1px solid ${palette.border}`,
    borderRadius: 24,
    ...extra,
  };
}

/** Backward-compat dark-only glass helper */
export const glass = (extra = {}) => ({
  background: C.card,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: `1px solid ${C.border}`,
  borderRadius: 24,
  ...extra,
});
