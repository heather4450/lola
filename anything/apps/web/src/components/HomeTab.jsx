import { useState, useEffect } from "react";
import { Zap, ShieldCheck, Trophy, Gift, Sparkles } from "lucide-react";
import { useTheme } from "./ThemeContext";
import TopUpModal from "./TopUpModal";
import RedeemKeyModal from "./RedeemKeyModal";

export default function HomeTab({ user, token, setActiveTab }) {
  const { theme: t } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch("/api/user/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setProfile(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, refreshKey]);

  const displayName = user?.first_name
    ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}`
    : profile?.user?.first_name || "User";

  const credits = profile?.user?.credits ?? user?.credits ?? 100;
  const isPremium = profile?.user?.is_premium ?? user?.is_premium ?? false;
  const totalHits = profile?.user?.total_hits ?? 0;
  const adminContact =
    process.env.NEXT_PUBLIC_ADMIN_CONTACT_URL || "https://t.me/";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px 100px",
        animation: "fadeIn 0.4s ease",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${t.neonBlue}, ${t.neonPurple})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          fontWeight: 700,
          color: "#fff",
          marginBottom: 16,
          border: `2px solid ${t.neonBlue}50`,
          boxShadow: `0 0 32px ${t.neonBlue}40`,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {user?.photo_url ? (
          <img
            src={user.photo_url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          (displayName[0] || "U").toUpperCase()
        )}
      </div>

      {/* Name + badge */}
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: t.text,
            marginBottom: 4,
          }}
        >
          {displayName}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {user?.username && (
            <span style={{ fontSize: 13, color: t.textMuted }}>
              @{user.username}
            </span>
          )}
          {isPremium && (
            <span
              style={{
                background: "linear-gradient(90deg, #f59e0b, #f97316)",
                borderRadius: 8,
                padding: "2px 8px",
                fontSize: 10,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              ★ PREMIUM
            </span>
          )}
        </div>
      </div>

      {/* Hits */}
      {totalHits > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginBottom: 28,
            marginTop: 4,
            padding: "4px 12px",
            borderRadius: 20,
            background: `${t.neonYellow}12`,
            border: `1px solid ${t.neonYellow}30`,
          }}
        >
          <Trophy size={11} color={t.neonYellow} />
          <span style={{ fontSize: 11, color: t.neonYellow, fontWeight: 600 }}>
            {totalHits.toLocaleString()} hits
          </span>
        </div>
      )}

      {!totalHits && <div style={{ marginBottom: 28 }} />}

      {/* Credits pill — gold premium */}
      <div
        style={{
          padding: "12px 32px",
          borderRadius: 50,
          background:
            "linear-gradient(135deg, rgba(255,214,10,0.14), rgba(255,159,10,0.09))",
          border: "1px solid rgba(255,214,10,0.32)",
          marginBottom: 36,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          boxShadow:
            "0 0 28px rgba(255,180,0,0.18), 0 0 56px rgba(255,159,10,0.08)",
        }}
      >
        <Sparkles
          size={14}
          color="#FFD60A"
          style={{ alignSelf: "center", flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: 34,
            fontWeight: 800,
            background:
              "linear-gradient(135deg, #FFD60A 0%, #FF9F0A 60%, #FF6A00 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          {loading ? "—" : credits}
        </span>
        <span
          style={{
            fontSize: 12,
            color: t.textMuted,
            fontWeight: 600,
            alignSelf: "center",
          }}
        >
          Credits
        </span>
      </div>

      {/* 2 big action buttons */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
          maxWidth: 320,
        }}
      >
        <button
          onClick={() => setActiveTab("checker")}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 16,
            border: "none",
            background: `linear-gradient(135deg, #0055ee, ${t.neonBlue})`,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            boxShadow: `0 6px 24px ${t.neonBlue}40`,
            letterSpacing: "0.04em",
          }}
        >
          <Zap size={17} />
          GENERATOR
        </button>

        <button
          onClick={() => setActiveTab("checker")}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 16,
            border: `1px solid ${t.neonGreen}40`,
            background: `${t.neonGreen}12`,
            color: t.neonGreen,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            boxShadow: `0 4px 16px ${t.neonGreen}20`,
            letterSpacing: "0.04em",
          }}
        >
          <ShieldCheck size={17} />
          CHECKER
        </button>
      </div>

      {/* Redeem / Top-up links */}
      <div style={{ display: "flex", gap: 20, marginTop: 28 }}>
        <button
          onClick={() => setShowTopUp(true)}
          style={{
            background: "none",
            border: "none",
            color: t.textMuted,
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontWeight: 500,
          }}
        >
          <Sparkles size={12} color={t.neonBlue} />
          Get Credits
        </button>
        <div style={{ width: 1, background: t.border }} />
        <button
          onClick={() => setShowRedeem(true)}
          style={{
            background: "none",
            border: "none",
            color: t.textMuted,
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontWeight: 500,
          }}
        >
          <Gift size={12} color={t.neonGreen} />
          Redeem Key
        </button>
      </div>

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

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
