import { Copy, Download, Trash2, Check } from "lucide-react";
import { useTheme } from "@/components/ThemeContext";
import { getC, getGlass } from "@/utils/checkerStyles";
import { ResultRow } from "./ResultRow";

export function ResultsPanel({
  results,
  isChecking,
  filterTab,
  copiedFilter,
  onCopy,
  onDownload,
  onClear,
  resultsRef,
}) {
  const { theme } = useTheme();
  const C = getC(theme);

  return (
    <div
      style={{
        ...getGlass(C, { borderRadius: 22, padding: 0, overflow: "hidden" }),
      }}
    >
      {/* panel header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 14px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 7 }}>
          {isChecking && (
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: C.green,
                boxShadow: `0 0 8px ${C.green}`,
                animation: "pulse 1.2s ease infinite",
              }}
            />
          )}
          <span
            style={{
              fontSize: 11,
              color: C.muted,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
            }}
          >
            {isChecking ? "Live" : "Results"} ·{" "}
            {results.length.toLocaleString()}{" "}
            {filterTab !== "all" ? filterTab : "total"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {[
            {
              icon: copiedFilter ? Check : Copy,
              onClick: onCopy,
              title: "Copy",
              active: copiedFilter,
            },
            { icon: Download, onClick: onDownload, title: "Download" },
            { icon: Trash2, onClick: onClear, title: "Clear", danger: true },
          ].map(({ icon: Icon, onClick, title, active, danger }) => (
            <button
              key={title}
              onClick={onClick}
              title={title}
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                border: "none",
                background: active ? `${C.green}15` : "transparent",
                color: active ? C.green : danger ? C.red : C.muted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: danger ? 0.6 : 1,
                transition: "all 0.15s",
              }}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* results list */}
      <div ref={resultsRef} style={{ maxHeight: 340, overflowY: "auto" }}>
        {results.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: C.muted,
              fontSize: 13,
            }}
          >
            {isChecking
              ? "Waiting for results…"
              : "Paste cards and press Start"}
          </div>
        ) : (
          results.map((r, i) => <ResultRow key={`${r.line}-${i}`} result={r} />)
        )}
      </div>
    </div>
  );
}
