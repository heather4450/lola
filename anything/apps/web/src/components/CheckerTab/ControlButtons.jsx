import { Play, Square } from "lucide-react";
import { useTheme } from "@/components/ThemeContext";
import { getC } from "@/utils/checkerStyles";

export function ControlButtons({ isChecking, hasLines, onStart, onStop }) {
  const { theme } = useTheme();
  const C = getC(theme);

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
      <button
        onClick={onStart}
        disabled={isChecking || !hasLines}
        style={{
          flex: 1,
          padding: "15px",
          borderRadius: 20,
          border: "none",
          background:
            isChecking || !hasLines
              ? `${C.blue}18`
              : `linear-gradient(135deg, ${C.blue}, #2563eb)`,
          color: isChecking || !hasLines ? `${C.blue}70` : "#fff",
          fontSize: 14,
          fontWeight: 700,
          cursor: isChecking || !hasLines ? "not-allowed" : "pointer",
          boxShadow:
            isChecking || !hasLines
              ? "none"
              : `0 0 24px ${C.blue}45, 0 4px 14px rgba(0,0,0,0.4)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          transition: "all 0.25s ease",
        }}
      >
        <Play
          size={15}
          fill={isChecking || !hasLines ? "transparent" : "#fff"}
        />
        {isChecking ? "Checking…" : "Start"}
      </button>
      <button
        onClick={onStop}
        disabled={!isChecking}
        style={{
          flex: 1,
          padding: "15px",
          borderRadius: 20,
          background: isChecking ? `${C.red}14` : `${C.card}`,
          color: isChecking ? C.red : C.muted,
          fontSize: 14,
          fontWeight: 700,
          cursor: isChecking ? "pointer" : "not-allowed",
          boxShadow: isChecking ? `0 0 20px ${C.red}30` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          border: `1px solid ${isChecking ? C.red + "30" : C.border}`,
          transition: "all 0.25s ease",
        }}
      >
        <Square size={14} fill={isChecking ? C.red : "transparent"} />
        Stop
      </button>
    </div>
  );
}
