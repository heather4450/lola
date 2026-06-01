import { Upload, Sliders } from "lucide-react";
import { useTheme } from "@/components/ThemeContext";
import { getC, getGlass } from "@/utils/checkerStyles";

export function InputCard({
  customInput,
  queuedLines,
  onInputChange,
  onFileUpload,
  onFlipToGenerator,
  fileRef,
  isFlipped,
  overLimit,
  rawLineCount,
  cardLimit,
  isAdmin,
}) {
  const { theme } = useTheme();
  const C = getC(theme);

  const displayCount =
    rawLineCount ||
    (queuedLines.length > 0
      ? queuedLines.length
      : customInput.split("\n").filter((l) => l.trim()).length);

  return (
    <div
      style={{
        ...getGlass(C),
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        position: isFlipped ? "absolute" : "relative",
        inset: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "14px 15px 12px" }}>
        <textarea
          placeholder={"Paste cards here…\n4111111111111111|12|26|123"}
          value={queuedLines.length > 0 ? queuedLines.join("\n") : customInput}
          onChange={onInputChange}
          rows={4}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: queuedLines.length > 0 ? C.blue : C.text,
            fontFamily: "monospace",
            fontSize: 12,
            lineHeight: 1.75,
            resize: "none",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: overLimit ? C.red : displayCount > 0 ? C.blue : C.muted,
            }}
          >
            {displayCount > 0
              ? `${displayCount.toLocaleString()} lines${overLimit ? ` — max ${cardLimit.toLocaleString()}` : ""}`
              : ""}
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <input
              ref={fileRef}
              type="file"
              accept=".txt"
              onChange={onFileUpload}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.muted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Upload size={13} />
            </button>
            <button
              onClick={onFlipToGenerator}
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                border: `1px solid ${C.blue}28`,
                background: `${C.blue}10`,
                color: C.blue,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sliders size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
