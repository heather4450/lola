import { X, Sparkles, MessageCircle, Gift } from "lucide-react";
import { useTheme } from "./ThemeContext";

const PACKS = [
  { credits: 100, popular: false, label: "Starter" },
  { credits: 500, popular: true, label: "Standard" },
  { credits: 1000, popular: false, label: "Pro" },
  { credits: 5000, popular: false, label: "Power" },
];

export default function TopUpModal({ open, onClose, onRedeem, adminContact }) {
  const { theme: t } = useTheme();
  if (!open) return null;

  const contactUrl = adminContact || "https://t.me/";

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
          maxHeight: "90vh",
          overflowY: "auto",
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
            <Sparkles size={18} color={t.neonBlue} />
            <span style={{ fontSize: 16, fontWeight: 700, color: t.text }}>
              Get Credits
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

        <div
          style={{
            fontSize: 12,
            color: t.textMuted,
            marginBottom: 14,
            lineHeight: 1.5,
          }}
        >
          Pick a credit package and message the admin on Telegram to receive a
          redemption key.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {PACKS.map((p) => (
            <a
              key={p.credits}
              href={`${contactUrl}?text=I%20want%20to%20buy%20${p.credits}%20credits`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                position: "relative",
                background: p.popular
                  ? `linear-gradient(135deg, ${t.neonBlue}1a, ${t.neonPurple}1a)`
                  : t.surface,
                border: p.popular
                  ? `1px solid ${t.neonBlue}40`
                  : `1px solid ${t.border}`,
                borderRadius: 12,
                padding: "16px 10px",
                textAlign: "center",
                textDecoration: "none",
                cursor: "pointer",
                boxShadow: p.popular ? `0 0 12px ${t.neonBlue}30` : "none",
              }}
            >
              {p.popular && (
                <div
                  style={{
                    position: "absolute",
                    top: -8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: `linear-gradient(90deg, ${t.neonBlue}, ${t.neonPurple})`,
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    padding: "2px 8px",
                    borderRadius: 8,
                  }}
                >
                  POPULAR
                </div>
              )}
              <div
                style={{
                  fontSize: 11,
                  color: t.textMuted,
                  letterSpacing: "0.08em",
                  marginBottom: 4,
                }}
              >
                {p.label.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: p.popular ? t.neonBlue : t.text,
                  letterSpacing: "-0.5px",
                }}
              >
                {p.credits.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: t.textSub, marginTop: 2 }}>
                CREDITS
              </div>
            </a>
          ))}
        </div>

        <a
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            padding: "12px",
            background: `linear-gradient(135deg, #229ED9, #1B7CB0)`,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            borderRadius: 12,
            marginBottom: 8,
            boxSizing: "border-box",
          }}
        >
          <MessageCircle size={14} /> CONTACT ADMIN ON TELEGRAM
        </a>

        <button
          onClick={() => {
            onClose();
            onRedeem && onRedeem();
          }}
          style={{
            width: "100%",
            padding: "11px",
            borderRadius: 12,
            border: `1px solid ${t.border}`,
            background: t.surface,
            color: t.text,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Gift size={13} /> I HAVE A KEY → REDEEM
        </button>
      </div>
    </div>
  );
}
