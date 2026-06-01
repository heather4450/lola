import { useTheme } from "@/components/ThemeContext";
import { getC } from "@/utils/checkerStyles";

export function StatsPills({ good, bad, total, filterTab, onFilterChange }) {
  const { theme } = useTheme();
  const C = getC(theme);

  const stats = [
    {
      key: "approved",
      label: "Approved",
      value: good,
      color: C.green,
      shadow: `0 0 18px ${C.green}35`,
    },
    {
      key: "declined",
      label: "Declined",
      value: bad,
      color: C.red,
      shadow: `0 0 18px ${C.red}35`,
    },
    {
      key: "all",
      label: "Total",
      value: total,
      color: C.blue,
      shadow: `0 0 18px ${C.blue}25`,
    },
  ];

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      {stats.map(({ key, label, value, color, shadow }) => {
        const active = filterTab === key;
        return (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            style={{
              flex: 1,
              padding: "12px 8px",
              borderRadius: 18,
              background: active ? `${color}14` : C.card,
              border: active ? `1px solid ${color}45` : `1px solid ${C.border}`,
              boxShadow: active ? shadow : "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: active ? color : C.sub,
                letterSpacing: "-0.5px",
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontSize: 9,
                color: active ? color : C.muted,
                letterSpacing: "0.06em",
                marginTop: 3,
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
