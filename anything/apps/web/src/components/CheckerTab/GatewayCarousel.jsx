import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/components/ThemeContext";
import { getC, getGlass } from "@/utils/checkerStyles";

export function GatewayCarousel({
  gateway,
  gatewayIdx,
  totalGateways,
  onChangeGateway,
  gwTransition,
}) {
  const { theme } = useTheme();
  const C = getC(theme);

  return (
    <div
      style={{
        ...getGlass(C, { borderRadius: 20, padding: "0px" }),
        display: "flex",
        alignItems: "center",
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => onChangeGateway(-1)}
        style={{
          width: 48,
          height: 52,
          border: "none",
          background: "transparent",
          color: C.muted,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          borderRight: `1px solid ${C.border}`,
        }}
      >
        <ChevronLeft size={18} />
      </button>
      <div
        style={{
          flex: 1,
          textAlign: "center",
          padding: "0 10px",
          opacity: gwTransition ? 0 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: C.text,
            letterSpacing: "0.01em",
          }}
        >
          {gateway}
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
          {gatewayIdx + 1} of {totalGateways}
        </div>
      </div>
      <button
        onClick={() => onChangeGateway(1)}
        style={{
          width: 48,
          height: 52,
          border: "none",
          background: "transparent",
          color: C.muted,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          borderLeft: `1px solid ${C.border}`,
        }}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
