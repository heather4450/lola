import { useState } from "react";
import { X, Gift, Check } from "lucide-react";
import { useTheme } from "./ThemeContext";

export default function RedeemKeyModal({ open, onClose, token, onSuccess }) {
  const { theme: t } = useTheme();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/keys/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Redemption failed");
      setSuccess(data);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 380,
          background: t.surfaceStrong,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: `1px solid ${t.borderStrong}`,
          borderRadius: 20,
          padding: 20,
          animation: "fadeInUp 0.2s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Gift size={18} color={t.neonGreen} />
            <span style={{ fontSize: 16, fontWeight: 700, color: t.text }}>
              Redeem Key
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: t.textMuted,
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div
            style={{
              background: `${t.neonGreen}15`,
              border: `1px solid ${t.neonGreen}40`,
              borderRadius: 14,
              padding: 18,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: `${t.neonGreen}25`,
                margin: "0 auto 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={26} color={t.neonGreen} />
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: t.neonGreen,
                marginBottom: 4,
              }}
            >
              +{success.creditsGranted} CREDITS
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 14 }}>
              New balance: {success.newBalance}
            </div>
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: 10,
                border: "none",
                background: `linear-gradient(135deg, ${t.neonGreen}, #00aa44)`,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              CONTINUE
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: 12,
                color: t.textMuted,
                marginBottom: 10,
                lineHeight: 1.5,
              }}
            >
              Enter the redemption key you received to add credits to your
              account.
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="BCK-XXXX-XXXX-XXXX"
              autoFocus
              style={{
                width: "100%",
                padding: "12px 14px",
                background: t.inputBg,
                border: `1px solid ${t.border}`,
                borderRadius: 10,
                color: t.text,
                fontFamily: "monospace",
                fontSize: 14,
                letterSpacing: "0.05em",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 10,
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            {error && (
              <div
                style={{
                  background: `${t.neonRed}12`,
                  border: `1px solid ${t.neonRed}30`,
                  color: t.neonRed,
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  marginBottom: 10,
                }}
              >
                ⚠ {error}
              </div>
            )}
            <button
              onClick={submit}
              disabled={loading || !code}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                border: "none",
                background:
                  loading || !code
                    ? `${t.neonGreen}30`
                    : `linear-gradient(135deg, ${t.neonGreen}, #00aa44)`,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading || !code ? "not-allowed" : "pointer",
                letterSpacing: "0.04em",
              }}
            >
              {loading ? "REDEEMING..." : "REDEEM KEY"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
