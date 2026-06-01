import { useState, useEffect } from "react";
import {
  Zap,
  ShieldCheck,
  Star,
  Clock,
  Trophy,
  Sparkles,
  Gift,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import TopUpModal from "./TopUpModal";
import RedeemKeyModal from "./RedeemKeyModal";

function StatCardSmall({ icon, label, value, color, t }) {
  return (
    <div
      style={{
        flex: 1,
        background: `${color}10`,
        border: `1px solid ${color}25`,
        borderRadius: 14,
        padding: "12px 10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          marginBottom: 6,
        }}
      >
        {icon}
        <span
          style={{ fontSize: 10, color: t.textMuted, letterSpacing: "0.05em" }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color,
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function ProfileTab({ user, token }) {
  const { theme: t } = useTheme();
  const [profile, setProfile] = useState(null);
  const [credits, setCredits] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("stats");
  const [showTopUp, setShowTopUp] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("/api/user/profile", { headers }).then((r) => r.json()),
      fetch("/api/credits", { headers }).then((r) => r.json()),
      fetch("/api/leaderboard?period=all&limit=1", { headers }).then((r) =>
        r.json(),
      ),
    ])
      .then(([p, c, lb]) => {
        setProfile(p);
        setCredits(c);
        setMyRank(lb?.myRank || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, refreshKey]);

  const u = profile?.user || user || {};
  const stats = profile?.stats || {};
  const displayName = u.first_name
    ? `${u.first_name}${u.last_name ? " " + u.last_name : ""}`
    : "User";
  const hitRate =
    stats.totalChecked > 0
      ? ((stats.totalGood / stats.totalChecked) * 100).toFixed(1)
      : "0.0";
  const glass = {
    background: t.surface,
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: `1px solid ${t.border}`,
    borderRadius: 22,
  };
  const adminContact =
    process.env.NEXT_PUBLIC_ADMIN_CONTACT_URL || "https://t.me/";

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: `2px solid ${t.neonBlue}30`,
            borderTop: `2px solid ${t.neonBlue}`,
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 14px", maxWidth: 480, margin: "0 auto" }}>
      {/* Profile hero card */}
      <div
        style={{
          ...glass,
          background: `linear-gradient(135deg, ${t.neonBlue}12, ${t.neonPurple}10)`,
          border: `1px solid ${t.neonBlue}22`,
          padding: 22,
          marginBottom: 14,
          textAlign: "center",
          boxShadow: `0 0 40px ${t.neonBlue}10`,
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${t.neonBlue}, ${t.neonPurple})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 700,
            color: "#fff",
            margin: "0 auto 10px",
            border: `2px solid ${t.neonBlue}50`,
            boxShadow: `0 0 24px ${t.neonBlue}40`,
            overflow: "hidden",
          }}
        >
          {u.photo_url ? (
            <img
              src={u.photo_url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            (displayName[0] || "U").toUpperCase()
          )}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: t.text,
            marginBottom: 2,
          }}
        >
          {displayName}
        </div>
        {u.username && (
          <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8 }}>
            @{u.username}
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {u.is_premium && (
            <span
              style={{
                background: "linear-gradient(90deg, #f59e0b, #f97316)",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 10,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              ★ PREMIUM
            </span>
          )}
          <span
            style={{
              background: `${t.neonBlue}20`,
              border: `1px solid ${t.neonBlue}40`,
              borderRadius: 20,
              padding: "3px 10px",
              fontSize: 10,
              fontWeight: 600,
              color: t.neonBlue,
            }}
          >
            💎 {credits?.credits ?? u.credits ?? 100} CREDITS
          </span>
          {myRank && (
            <span
              style={{
                background: `${t.neonYellow}15`,
                border: `1px solid ${t.neonYellow}40`,
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 10,
                fontWeight: 600,
                color: t.neonYellow,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Trophy size={9} /> RANK #{myRank.rank}
            </span>
          )}
        </div>
      </div>

      {/* Top-up actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button
          onClick={() => setShowTopUp(true)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 12,
            border: "none",
            background: `linear-gradient(135deg, ${t.neonBlue}, ${t.neonPurple})`,
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            boxShadow: `0 4px 14px ${t.neonBlue}40`,
            letterSpacing: "0.04em",
          }}
        >
          <Sparkles size={13} /> GET CREDITS
        </button>
        <button
          onClick={() => setShowRedeem(true)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 12,
            border: `1px solid ${t.neonGreen}40`,
            background: `${t.neonGreen}15`,
            color: t.neonGreen,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            letterSpacing: "0.04em",
          }}
        >
          <Gift size={13} /> REDEEM KEY
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["stats", "credits"].map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            style={{
              flex: 1,
              padding: "9px 6px",
              borderRadius: 10,
              border:
                activeSection === s
                  ? `1px solid ${t.neonBlue}`
                  : `1px solid ${t.border}`,
              background: activeSection === s ? `${t.neonBlue}15` : t.surface,
              color: activeSection === s ? t.neonBlue : t.textMuted,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {activeSection === "stats" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <StatCardSmall
              t={t}
              icon={<Zap size={13} color={t.neonBlue} />}
              label="GENERATED"
              value={stats.totalGenerated?.toLocaleString() || "0"}
              color={t.neonBlue}
            />
            <StatCardSmall
              t={t}
              icon={<ShieldCheck size={13} color={t.neonGreen} />}
              label="CHECKED"
              value={stats.totalChecked?.toLocaleString() || "0"}
              color={t.neonGreen}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <StatCardSmall
              t={t}
              icon={<Star size={13} color={t.neonYellow} />}
              label="HITS"
              value={stats.totalGood?.toLocaleString() || "0"}
              color={t.neonYellow}
            />
            <StatCardSmall
              t={t}
              icon={<Trophy size={13} color={t.neonPurple} />}
              label="HIT RATE"
              value={`${hitRate}%`}
              color={t.neonPurple}
            />
          </div>
        </div>
      )}

      {activeSection === "credits" && (
        <div style={{ ...glass, padding: 14 }}>
          <div
            style={{
              fontSize: 11,
              color: t.textMuted,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Credit Transactions
          </div>
          {credits?.transactions?.length > 0 ? (
            credits.transactions.map((tx, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 0",
                  borderBottom:
                    i < credits.transactions.length - 1
                      ? `1px solid ${t.border}`
                      : "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: t.text, marginBottom: 1 }}>
                    {tx.description || tx.transaction_type}
                  </div>
                  <div style={{ fontSize: 9, color: t.textSub }}>
                    {new Date(tx.created_at).toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: tx.amount > 0 ? t.neonGreen : t.neonRed,
                  }}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount}
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "26px 0",
                color: t.textMuted,
                fontSize: 12,
              }}
            >
              No transactions yet
            </div>
          )}
        </div>
      )}

      <TopUpModal
        open={showTopUp}
        onClose={() => setShowTopUp(false)}
        onRedeem={() => setShowRedeem(true)}
        adminContact={adminContact}
      />
      <RedeemKeyModal
        open={showRedeem}
        onClose={() => setShowRedeem(false)}
        token={token}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
