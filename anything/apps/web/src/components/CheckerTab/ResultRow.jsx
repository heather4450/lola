import { useTheme } from "@/components/ThemeContext";
import { getC } from "@/utils/checkerStyles";

export function ResultRow({ result }) {
  const { theme } = useTheme();
  const C = getC(theme);

  const ok = result.status === "good";
  const parts = result.line.split("|");
  const num = parts[0] || "";
  const masked =
    num.length > 10
      ? num.slice(0, 6) +
        "●".repeat(Math.max(0, num.length - 10)) +
        num.slice(-4)
      : num;
  const rest = parts.slice(1).join("|");
  const time = new Date(result.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div
      style={{
        padding: "12px 14px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        animation: "rowIn 0.2s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          flexShrink: 0,
          marginTop: 5,
          background: ok ? C.green : C.red,
          boxShadow: `0 0 8px ${ok ? C.green : C.red}80`,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 12.5,
            color: ok ? C.green : C.muted,
            fontWeight: ok ? 600 : 400,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {masked}
          {rest ? `|${rest}` : ""}
        </div>
        {result.gatewayCode && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 5,
            }}
          >
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.07em",
                fontFamily: "monospace",
                background: ok ? `${C.green}14` : `${C.red}10`,
                border: `1px solid ${ok ? C.green + "30" : C.red + "25"}`,
                color: ok ? C.green : C.red,
              }}
            >
              {result.gatewayCode}
            </span>
            <span
              style={{
                fontSize: 10,
                color: C.muted,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {result.gatewayMessage}
            </span>
          </div>
        )}
        {ok && result.binInfo && (
          <div
            style={{
              fontSize: 10,
              color: C.muted,
              marginTop: 4,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {result.binInfo.bank && <span>🏦 {result.binInfo.bank}</span>}
            {result.binInfo.country && (
              <span>
                {result.binInfo.emoji} {result.binInfo.country}
              </span>
            )}
            {result.binInfo.scheme && (
              <span>
                💎 {result.binInfo.type} · {result.binInfo.scheme}
              </span>
            )}
          </div>
        )}
      </div>
      <span
        style={{ fontSize: 9, color: C.muted, flexShrink: 0, marginTop: 2 }}
      >
        {time}
      </span>
    </div>
  );
}
