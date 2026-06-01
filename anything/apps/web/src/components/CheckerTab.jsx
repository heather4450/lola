import { useState, useRef, useEffect, useCallback } from "react";
import { X, AlertTriangle } from "lucide-react";
import { UserHeader } from "./CheckerTab/UserHeader";
import { InputCard } from "./CheckerTab/InputCard";
import { GeneratorPanel } from "./CheckerTab/GeneratorPanel";
import { GatewayCarousel } from "./CheckerTab/GatewayCarousel";
import { ControlButtons } from "./CheckerTab/ControlButtons";
import { StatsPills } from "./CheckerTab/StatsPills";
import { ResultsPanel } from "./CheckerTab/ResultsPanel";
import { GATEWAYS as STATIC_GATEWAYS } from "@/utils/gateways";
import { sleep } from "@/utils/cardHelpers";
import { getC, getGlass } from "@/utils/checkerStyles";
import { useTheme } from "@/components/ThemeContext";

const CARD_LIMIT = 2000;

/* ── Floating toast ──────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, []);
  const col =
    type === "error" ? "#FF453A" : type === "warn" ? "#FF9F0A" : "#30D158";
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        minWidth: 260,
        maxWidth: "92vw",
        background: "rgba(16,16,24,0.97)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: `1px solid ${col}38`,
        borderRadius: 16,
        padding: "13px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.65)",
        animation: "toastIn 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <AlertTriangle size={14} color={col} />
      <span style={{ fontSize: 13, color: "#fff", fontWeight: 500, flex: 1 }}>
        {msg}
      </span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: 0,
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

export default function CheckerTab({ token, user, isAdmin }) {
  const { theme } = useTheme();
  const C = getC(theme);

  const [results, setResults] = useState([]);
  const [good, setGood] = useState(0);
  const [bad, setBad] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [queuedLines, setQueuedLines] = useState([]);
  const [gatewayIdx, setGatewayIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterTab, setFilterTab] = useState("all");
  const [copiedFilter, setCopiedFilter] = useState(false);
  const [credits, setCredits] = useState(null);
  const [gwTransition, setGwTransition] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeGateways, setActiveGateways] = useState(STATIC_GATEWAYS);

  const isRunningRef = useRef(false);
  const resultsRef = useRef(null);
  const fileRef = useRef(null);

  const LIMIT = isAdmin ? Infinity : CARD_LIMIT;
  const showToast = (msg, type = "error") => setToast({ msg, type });

  /* fetch active gateways for normal users */
  useEffect(() => {
    if (isAdmin) return; // admins see all gateways
    fetch("/api/gateways")
      .then((r) => r.json())
      .then((d) => {
        if (d.gateways?.length) setActiveGateways(d.gateways);
      })
      .catch(() => {});
  }, [isAdmin]);

  /* fetch credits */
  useEffect(() => {
    if (!token) return;
    fetch("/api/credits", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setCredits(d.credits))
      .catch(() => {});
  }, [token]);

  /* auto-scroll results */
  useEffect(() => {
    if (resultsRef.current) resultsRef.current.scrollTop = 0;
  }, [results.length]);

  const GATEWAYS = isAdmin ? STATIC_GATEWAYS : activeGateways;
  const clampedIdx = Math.min(gatewayIdx, Math.max(0, GATEWAYS.length - 1));
  const gateway = GATEWAYS[clampedIdx] || GATEWAYS[0];

  const rawLines =
    queuedLines.length > 0
      ? queuedLines
      : customInput.split("\n").filter((l) => l.trim());
  const lines = isAdmin ? rawLines : rawLines.slice(0, LIMIT);
  const overLimit = !isAdmin && rawLines.length > CARD_LIMIT;

  const approved = results.filter((r) => r.status === "good");
  const declined = results.filter((r) => r.status !== "good");
  const shown =
    filterTab === "approved"
      ? approved
      : filterTab === "declined"
        ? declined
        : results;

  /* gateway carousel */
  const changeGateway = (dir) => {
    setGwTransition(true);
    setTimeout(() => {
      setGatewayIdx((i) => (i + dir + GATEWAYS.length) % GATEWAYS.length);
      setGwTransition(false);
    }, 150);
  };

  /* checker */
  const startChecker = useCallback(async () => {
    if (lines.length === 0 || isChecking) return;
    if (overLimit) {
      showToast(
        `Card limit is ${CARD_LIMIT.toLocaleString()}. Trim your list.`,
        "warn",
      );
      return;
    }
    isRunningRef.current = true;
    setIsChecking(true);
    setResults([]);
    setGood(0);
    setBad(0);
    setFilterTab("all");
    const BATCH = 100;
    let tg = 0,
      tb = 0;
    for (let i = 0; i < lines.length; i += BATCH) {
      if (!isRunningRef.current) break;
      const batch = lines.slice(i, i + BATCH);
      try {
        const res = await fetch("/api/checker/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ lines: batch, gateway }),
        });
        if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          showToast(
            errData.error || "Gateway is disabled. Select another.",
            "error",
          );
          isRunningRef.current = false;
          setIsChecking(false);
          return;
        }
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        for (const r of data.results || []) {
          if (!isRunningRef.current) break;
          if (r.status === "good") tg++;
          else tb++;
          setGood(tg);
          setBad(tb);
          setResults((prev) => [r, ...prev]);
          await sleep(18);
        }
        if (data.stats?.creditsUsed && token) {
          setCredits((c) =>
            c !== null ? Math.max(0, c - data.stats.creditsUsed) : c,
          );
        }
      } catch (e) {
        console.error(e);
      }
    }
    isRunningRef.current = false;
    setIsChecking(false);
  }, [lines, token, gateway, overLimit]);

  const stop = () => {
    isRunningRef.current = false;
    setIsChecking(false);
  };
  const clear = () => {
    setResults([]);
    setGood(0);
    setBad(0);
    setQueuedLines([]);
    setCustomInput("");
  };

  const copyShown = async () => {
    const text = shown.map((r) => r.line).join("\n");
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedFilter(true);
    setTimeout(() => setCopiedFilter(false), 1800);
  };

  const downloadShown = () => {
    const text = shown.map((r) => r.line).join("\n");
    if (!text) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = `${filterTab}_${Date.now()}.txt`;
    a.click();
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result || "";
      const parsed = text.split("\n").filter((l) => l.trim());
      if (!isAdmin && parsed.length > CARD_LIMIT)
        showToast(
          `File has ${parsed.length.toLocaleString()} lines — max ${CARD_LIMIT.toLocaleString()}. Truncating.`,
          "warn",
        );
      setQueuedLines(isAdmin ? parsed : parsed.slice(0, CARD_LIMIT));
      setCustomInput("");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const onGenerated = (ls) => {
    setQueuedLines(ls);
    setCustomInput("");
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    const count = val.split("\n").filter((l) => l.trim()).length;
    if (!isAdmin && count > CARD_LIMIT)
      showToast(
        `Paste exceeds ${CARD_LIMIT.toLocaleString()} card limit`,
        "warn",
      );
    setCustomInput(val);
    setQueuedLines([]);
  };

  /* ── render ───────────────────────────────────────────── */
  return (
    <div
      style={{ padding: "14px 14px 100px", maxWidth: 480, margin: "0 auto" }}
    >
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <UserHeader user={user} credits={credits} isAdmin={isAdmin} />

      {/* ── FLIP CARD ────────────────────────────────────── */}
      <div style={{ perspective: 1200, marginBottom: 12 }}>
        <div
          style={{
            position: "relative",
            minHeight: isFlipped ? 420 : 160,
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.52s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* FRONT — checker input */}
          <InputCard
            customInput={customInput}
            queuedLines={queuedLines}
            onInputChange={handleInputChange}
            onFileUpload={handleFile}
            onFlipToGenerator={() => setIsFlipped(true)}
            fileRef={fileRef}
            isFlipped={isFlipped}
            overLimit={overLimit}
            rawLineCount={rawLines.length}
            cardLimit={CARD_LIMIT}
            isAdmin={isAdmin}
          />

          {/* BACK — generator */}
          <div
            style={{
              ...getGlass(C, { borderRadius: 24 }),
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              position: "absolute",
              inset: 0,
              transform: "rotateY(180deg)",
              overflow: "hidden",
            }}
          >
            <GeneratorPanel
              onGenerated={onGenerated}
              onFlip={() => setIsFlipped(false)}
              isAdmin={isAdmin}
              showToast={showToast}
            />
          </div>
        </div>
      </div>

      <GatewayCarousel
        gateway={gateway}
        gatewayIdx={clampedIdx}
        totalGateways={GATEWAYS.length}
        onChangeGateway={changeGateway}
        gwTransition={gwTransition}
      />

      <ControlButtons
        isChecking={isChecking}
        hasLines={lines.length > 0}
        onStart={startChecker}
        onStop={stop}
      />
      <StatsPills
        good={good}
        bad={bad}
        total={results.length}
        filterTab={filterTab}
        onFilterChange={setFilterTab}
      />
      <ResultsPanel
        results={shown}
        isChecking={isChecking}
        filterTab={filterTab}
        copiedFilter={copiedFilter}
        onCopy={copyShown}
        onDownload={downloadShown}
        onClear={clear}
        resultsRef={resultsRef}
      />

      <style>{`
        @keyframes rowIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(-10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        * { -webkit-font-smoothing: antialiased; }
        textarea::placeholder { color: ${C.muted}; font-family: monospace; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
      `}</style>
    </div>
  );
}
