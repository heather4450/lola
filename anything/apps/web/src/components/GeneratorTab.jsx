import { useState, useEffect } from "react";
import { Copy, Trash2, Download, Zap, ChevronRight, Clock } from "lucide-react";

const QUICK = [50, 100, 500, 1000, 2000];
const MAX = 2000;

export default function GeneratorTab({ token, onGenerated }) {
  const [prefix, setPrefix] = useState("");
  const [amount, setAmount] = useState(100);
  const [amountInput, setAmountInput] = useState("100");
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [recentBins, setRecentBins] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const s = JSON.parse(
        localStorage.getItem("binchecker_recent_bins") || "[]",
      );
      if (Array.isArray(s)) setRecentBins(s.slice(0, 6));
    } catch {}
  }, []);

  const saveRecent = (bin) => {
    if (typeof window === "undefined") return;
    const next = [bin, ...recentBins.filter((b) => b !== bin)].slice(0, 6);
    setRecentBins(next);
    localStorage.setItem("binchecker_recent_bins", JSON.stringify(next));
  };

  const setAmountSafe = (val) => {
    const n = parseInt(val);
    if (isNaN(n)) {
      setAmountInput("");
      setAmount(0);
      return;
    }
    const c = Math.max(1, Math.min(n, MAX));
    setAmount(c);
    setAmountInput(String(c));
  };

  const handleAmountInput = (val) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    setAmountInput(clean);
    if (!clean) return;
    const n = parseInt(clean);
    if (n > MAX) {
      setAmount(MAX);
      setAmountInput(String(MAX));
    } else setAmount(n);
  };

  const generate = async () => {
    if (!prefix || prefix.length < 4) {
      setError("Enter at least 4 digits");
      return;
    }
    if (!/^\d+$/.test(prefix)) {
      setError("Digits only");
      return;
    }
    if (!amount || amount < 1) {
      setError("Enter a valid amount");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generator/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prefix, amount }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setLines(data.lines || []);
      saveRecent(prefix);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportTxt = () => {
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gen_${prefix}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const creditCost = Math.max(1, Math.ceil(amount / 100));

  return (
    <div style={{ padding: 16, background: "#111", minHeight: "100vh" }}>
      {/* BIN input */}
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.1em",
            marginBottom: 10,
          }}
        >
          BIN / PREFIX
        </div>
        <input
          type="tel"
          value={prefix}
          onChange={(e) =>
            setPrefix(e.target.value.replace(/\D/g, "").slice(0, 12))
          }
          placeholder="e.g. 466447, 535316..."
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "13px 14px",
            fontSize: 16,
            color: "#fff",
            fontFamily: "monospace",
            letterSpacing: "0.05em",
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) =>
            (e.target.style.borderColor = "rgba(79,195,247,0.45)")
          }
          onBlur={(e) =>
            (e.target.style.borderColor = "rgba(255,255,255,0.08)")
          }
        />
        {recentBins.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.2)",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Clock size={9} /> RECENT
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {recentBins.map((b) => (
                <button
                  key={b}
                  onClick={() => setPrefix(b)}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    padding: "4px 10px",
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 11,
                    fontFamily: "monospace",
                    cursor: "pointer",
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}
        <div
          style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 8 }}
        >
          <span style={{ color: "#4fc3f7", fontFamily: "monospace" }}>
            {prefix || "XXXXXX"}XXXXXXXXXX|MM|YY|CVV
          </span>
        </div>
      </div>

      {/* Amount */}
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.1em",
            }}
          >
            AMOUNT (MAX {MAX})
          </span>
          <span style={{ fontSize: 11, color: "#4fc3f7" }}>
            {creditCost} cr
          </span>
        </div>
        <input
          type="tel"
          value={amountInput}
          onChange={(e) => handleAmountInput(e.target.value)}
          placeholder="100"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "13px 14px",
            fontSize: 22,
            fontWeight: 700,
            color: "#4fc3f7",
            fontFamily: "monospace",
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 10,
            textAlign: "center",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(79,195,247,0.45)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(255,255,255,0.08)";
            setAmountSafe(amountInput || "1");
          }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {QUICK.map((a) => (
            <button
              key={a}
              onClick={() => setAmountSafe(a)}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 8,
                border:
                  amount === a
                    ? "1px solid rgba(79,195,247,0.5)"
                    : "1px solid rgba(255,255,255,0.07)",
                background:
                  amount === a
                    ? "rgba(79,195,247,0.1)"
                    : "rgba(255,255,255,0.03)",
                color: amount === a ? "#4fc3f7" : "rgba(255,255,255,0.35)",
                fontSize: 12,
                fontWeight: amount === a ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {a >= 1000 ? `${a / 1000}k` : a}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(255,82,82,0.08)",
            border: "1px solid rgba(255,82,82,0.2)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            color: "#ff5252",
            marginBottom: 12,
          }}
        >
          ⚠ {error}
        </div>
      )}

      <button
        onClick={generate}
        disabled={loading}
        style={{
          width: "100%",
          padding: "15px",
          borderRadius: 14,
          border: "none",
          background: loading ? "rgba(79,195,247,0.18)" : "#1565c0",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 16,
          letterSpacing: "0.04em",
          boxShadow: loading ? "none" : "0 4px 20px rgba(21,101,192,0.5)",
        }}
      >
        <Zap size={16} />
        {loading ? "GENERATING..." : `GENERATE ${amount.toLocaleString()}`}
      </button>

      {lines.length > 0 && (
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#00e676",
                  boxShadow: "0 0 6px #00e676",
                  animation: "pulse 1.5s ease infinite",
                }}
              />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                {lines.length.toLocaleString()} generated
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn
                icon={<Copy size={11} />}
                label={copied ? "✓" : "Copy"}
                onClick={copyAll}
              />
              <Btn
                icon={<Download size={11} />}
                label="Export"
                onClick={exportTxt}
              />
              <Btn
                icon={<Trash2 size={11} />}
                label="Clear"
                onClick={() => setLines([])}
                danger
              />
            </div>
          </div>
          <div
            style={{
              background: "#161616",
              padding: 14,
              maxHeight: 260,
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: 12,
              lineHeight: 1.8,
              color: "#00e676",
              letterSpacing: "0.02em",
            }}
          >
            {lines.map((line, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i < lines.length - 1
                      ? "1px solid rgba(255,255,255,0.03)"
                      : "none",
                }}
              >
                <span style={{ color: "rgba(0,230,118,0.3)", marginRight: 8 }}>
                  {String(i + 1).padStart(3, "0")}
                </span>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {lines.length > 0 && (
        <button
          onClick={() => onGenerated && onGenerated(lines)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            border: "1px solid rgba(0,230,118,0.25)",
            background: "rgba(0,230,118,0.07)",
            color: "#00e676",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            letterSpacing: "0.04em",
          }}
        >
          <ChevronRight size={16} />
          SEND {lines.length.toLocaleString()} TO CHECKER
        </button>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }`}</style>
    </div>
  );
}

function Btn({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: danger ? "rgba(255,82,82,0.08)" : "rgba(255,255,255,0.05)",
        border: danger
          ? "1px solid rgba(255,82,82,0.2)"
          : "1px solid rgba(255,255,255,0.07)",
        borderRadius: 7,
        padding: "4px 8px",
        color: danger ? "#ff5252" : "rgba(255,255,255,0.45)",
        fontSize: 11,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 3,
        fontWeight: 500,
      }}
    >
      {icon}
      {label}
    </button>
  );
}
