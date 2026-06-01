import { useState } from "react";
import { Check, Zap, RotateCcw } from "lucide-react";
import { useTheme } from "@/components/ThemeContext";
import { getC } from "@/utils/checkerStyles";
import { generateCard, sleep } from "@/utils/cardHelpers";

const CARD_LIMIT = 2000;

export function GeneratorPanel({ onGenerated, onFlip, isAdmin, showToast }) {
  const { theme } = useTheme();
  const C = getC(theme);

  const [bin, setBin] = useState("");
  const [mm, setMm] = useState("rnd");
  const [yy, setYy] = useState("rnd");
  const [cvv, setCvv] = useState("rnd");
  const [amount, setAmount] = useState("20");
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const limit = isAdmin ? Infinity : CARD_LIMIT;

  const generate = async () => {
    const b = bin.trim().replace(/\D/g, "");
    if (!b || b.length < 4) {
      if (showToast) showToast("Enter at least 4 BIN digits", "error");
      return;
    }
    const n = parseInt(amount) || 0;
    if (!n || n < 1) {
      if (showToast) showToast("Enter a valid amount", "error");
      return;
    }
    if (n > limit) {
      if (showToast)
        showToast(
          `Max ${limit === Infinity ? "unlimited" : limit.toLocaleString()} cards per operation`,
          "warn",
        );
      return;
    }
    setGenerating(true);
    setDone(false);
    const lines = [];
    for (let i = 0; i < n; i++) {
      const m =
        mm === "rnd"
          ? String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")
          : String(mm).padStart(2, "0");
      const y =
        yy === "rnd"
          ? String(
              new Date().getFullYear() + 1 + Math.floor(Math.random() * 5),
            ).slice(-2)
          : String(yy);
      const c =
        cvv === "rnd"
          ? String(Math.floor(Math.random() * 900) + 100)
          : String(cvv);
      lines.push(generateCard(b, m, y, c));
    }
    await sleep(220);
    setGenerating(false);
    setDone(true);
    setTimeout(() => {
      setDone(false);
      onGenerated(lines);
      onFlip();
    }, 480);
  };

  const iStyle = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: "12px 14px",
    color: C.text,
    fontSize: 13,
    outline: "none",
    fontFamily: "Inter, system-ui",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const lbl = (text) => (
    <div
      style={{
        fontSize: 10,
        color: C.muted,
        letterSpacing: "0.09em",
        marginBottom: 7,
        textTransform: "uppercase",
        fontWeight: 600,
      }}
    >
      {text}
    </div>
  );

  // RND toggle + optional fixed input
  const rndField = (val, setVal, placeholder, maxLen = 2) => (
    <div style={{ display: "flex", gap: 6 }}>
      <button
        onClick={() => setVal("rnd")}
        style={{
          flexShrink: 0,
          padding: "11px 12px",
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          background: val === "rnd" ? `${C.blue}18` : "transparent",
          border:
            val === "rnd" ? `1px solid ${C.blue}45` : `1px solid ${C.border}`,
          color: val === "rnd" ? C.blue : C.muted,
        }}
      >
        RND
      </button>
      <input
        value={val === "rnd" ? "" : val}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, maxLen);
          setVal(v || "rnd");
        }}
        onFocus={() => {
          if (val === "rnd") setVal("");
        }}
        onBlur={(e) => {
          if (!e.target.value.trim()) setVal("rnd");
        }}
        placeholder={placeholder}
        style={{
          ...iStyle,
          flex: 1,
          fontSize: 14,
          borderColor: val !== "rnd" ? `${C.blue}40` : C.border,
        }}
      />
    </div>
  );

  return (
    <div
      style={{
        padding: "18px 18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
            Generator
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {isAdmin
              ? "Unlimited (admin)"
              : `Up to ${CARD_LIMIT.toLocaleString()} cards`}
          </div>
        </div>
        <button
          onClick={onFlip}
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "7px 12px",
            color: C.muted,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
          }}
        >
          <RotateCcw size={12} /> Back
        </button>
      </div>

      {/* BIN */}
      <div>
        {lbl("BIN")}
        <input
          value={bin}
          onChange={(e) =>
            setBin(e.target.value.replace(/\D/g, "").slice(0, 12))
          }
          placeholder="e.g. 411111"
          style={{
            ...iStyle,
            fontFamily: "monospace",
            letterSpacing: "0.08em",
            fontSize: 14,
          }}
        />
      </div>

      {/* Month + Year */}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          {lbl("Exp Month")}
          {rndField(mm, setMm, "MM")}
        </div>
        <div style={{ flex: 1 }}>
          {lbl("Exp Year")}
          {rndField(yy, setYy, "YY")}
        </div>
      </div>

      {/* CVV — defaults to rnd */}
      <div>
        {lbl("CVV")}
        {rndField(cvv, setCvv, "CVV", 4)}
      </div>

      {/* Amount — plain number input (no slider) */}
      <div>
        {lbl(
          `Amount${!isAdmin ? ` — max ${CARD_LIMIT.toLocaleString()}` : " — unlimited"}`,
        )}
        <input
          type="tel"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="e.g. 100"
          style={{
            ...iStyle,
            fontFamily: "monospace",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.05em",
            textAlign: "center",
          }}
        />
      </div>

      {/* Generate */}
      <button
        onClick={generate}
        disabled={!bin.trim() || generating}
        style={{
          padding: "14px",
          borderRadius: 16,
          border: "none",
          background: done
            ? `linear-gradient(135deg, ${C.green}, #1a8c3c)`
            : generating
              ? `${C.blue}28`
              : `linear-gradient(135deg, ${C.blue}, #2563eb)`,
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          cursor: !bin.trim() || generating ? "not-allowed" : "pointer",
          boxShadow: done
            ? `0 0 24px ${C.green}50`
            : generating
              ? "none"
              : `0 4px 20px ${C.blue}50`,
          transition: "all 0.22s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {done ? (
          <>
            <Check size={15} /> Generated!
          </>
        ) : generating ? (
          "Generating…"
        ) : (
          <>
            <Zap size={15} /> Generate {parseInt(amount) || 0} Cards
          </>
        )}
      </button>
    </div>
  );
}
