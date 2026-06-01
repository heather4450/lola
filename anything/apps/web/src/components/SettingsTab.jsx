import { useState, useEffect } from "react";
import {
  Save,
  Wifi,
  WifiOff,
  Bot,
  Sun,
  Moon,
  Gift,
  Bell,
  BellOff,
  MessageCircle,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import RedeemKeyModal from "./RedeemKeyModal";

export default function SettingsTab({ token, onCreditsUpdated }) {
  const { theme: t, themeName, toggleTheme } = useTheme();
  const [proxyList, setProxyList] = useState("");
  const [proxyActive, setProxyActive] = useState(false);
  const [proxyType, setProxyType] = useState("http");
  const [proxyCount, setProxyCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    hits: true,
  });
  const [showRedeem, setShowRedeem] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/proxy/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setProxyActive(d.active || false);
        setProxyList((d.proxies || []).join("\n"));
        setProxyType(d.type || "http");
        setProxyCount(d.count || 0);
      })
      .catch(() => {});

    fetch("/api/user/preferences", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.notifications)
          setNotifications({ hits: d.notifications.hits !== false });
      })
      .catch(() => {});
  }, [token]);

  const saveProxy = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/proxy/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          proxy_list: proxyList,
          is_active: proxyActive,
          proxy_type: proxyType,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const d = await res.json();
      setProxyCount(d.count || 0);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleProxyListChange = (val) => {
    setProxyList(val);
    setProxyCount(val.split("\n").filter((p) => p.trim()).length);
  };

  const updateNotification = (key, value) => {
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    if (!token) return;
    fetch("/api/user/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ notifications: next }),
    }).catch(() => {});
  };

  const glass = {
    background: t.surface,
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: `1px solid ${t.border}`,
    borderRadius: 22,
  };
  const adminContact =
    process.env.NEXT_PUBLIC_ADMIN_CONTACT_URL || "https://t.me/";

  return (
    <div
      style={{
        padding: "16px 14px",
        maxWidth: 480,
        margin: "0 auto",
        animation: "fadeInUp 0.3s ease",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            color: t.textMuted,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Configuration
        </div>
        <div
          style={{ fontSize: 22, fontWeight: 700, color: t.text, marginTop: 2 }}
        >
          Settings
        </div>
      </div>

      {/* Redeem Key */}
      <button
        onClick={() => setShowRedeem(true)}
        style={{
          ...glass,
          width: "100%",
          padding: "14px 16px",
          marginBottom: 12,
          border: `1px solid ${t.neonGreen}40`,
          background: `linear-gradient(135deg, ${t.neonGreen}10, ${t.neonBlue}10)`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: `0 0 16px ${t.neonGreen}15`,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${t.neonGreen}20`,
            border: `1px solid ${t.neonGreen}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Gift size={16} color={t.neonGreen} />
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
            Redeem Key
          </div>
          <div style={{ fontSize: 11, color: t.textMuted }}>
            Enter a code to add credits
          </div>
        </div>
      </button>

      {/* Theme Toggle */}
      <div style={{ ...glass, padding: 16, marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {themeName === "dark" ? (
              <Moon size={16} color={t.neonBlue} />
            ) : (
              <Sun size={16} color={t.neonYellow} />
            )}
            <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
              Theme
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: 3,
              background: t.inputBg,
              borderRadius: 10,
              border: `1px solid ${t.border}`,
            }}
          >
            <button
              onClick={() => themeName !== "dark" && toggleTheme()}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                background: themeName === "dark" ? t.neonBlue : "transparent",
                color: themeName === "dark" ? "#fff" : t.textMuted,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Moon size={11} /> DARK
            </button>
            <button
              onClick={() => themeName !== "light" && toggleTheme()}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                background:
                  themeName === "light" ? t.neonYellow : "transparent",
                color: themeName === "light" ? "#fff" : t.textMuted,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Sun size={11} /> LIGHT
            </button>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div style={{ ...glass, padding: 16, marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <Bell size={16} color={t.neonBlue} />
          <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
            Telegram Notifications
          </span>
        </div>
        <NotificationToggle
          t={t}
          label="Card Hits"
          desc="Send approved hits to Telegram"
          enabled={notifications.hits}
          onChange={(v) => updateNotification("hits", v)}
          last
        />
      </div>

      {/* Proxy Settings */}
      <div style={{ ...glass, padding: 16, marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {proxyActive ? (
              <Wifi size={16} color={t.neonGreen} />
            ) : (
              <WifiOff size={16} color={t.textMuted} />
            )}
            <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
              Proxy System
            </span>
          </div>
          <div
            onClick={() => setProxyActive((p) => !p)}
            style={{
              width: 46,
              height: 26,
              borderRadius: 13,
              background: proxyActive ? t.neonGreen : t.inputBg,
              position: "relative",
              cursor: "pointer",
              boxShadow: proxyActive ? `0 0 12px ${t.neonGreen}50` : "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                left: proxyActive ? 23 : 3,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              color: t.textMuted,
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            PROXY TYPE
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["http", "socks4", "socks5"].map((tp) => (
              <button
                key={tp}
                onClick={() => setProxyType(tp)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border:
                    proxyType === tp
                      ? `1px solid ${t.neonBlue}`
                      : `1px solid ${t.border}`,
                  background:
                    proxyType === tp ? `${t.neonBlue}15` : t.surfaceStrong,
                  color: proxyType === tp ? t.neonBlue : t.textMuted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                {tp}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              color: t.textMuted,
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            PROXY LIST ({proxyCount} loaded)
          </div>
          <textarea
            value={proxyList}
            onChange={(e) => handleProxyListChange(e.target.value)}
            placeholder={"host:port\nhost:port:user:pass"}
            rows={5}
            style={{
              width: "100%",
              background: t.inputBg,
              border: `1px solid ${t.border}`,
              borderRadius: 10,
              padding: "10px 12px",
              color: t.neonBlue,
              fontFamily: "monospace",
              fontSize: 12,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
              lineHeight: 1.6,
            }}
          />
        </div>

        <button
          onClick={saveProxy}
          disabled={saving}
          style={{
            width: "100%",
            marginTop: 12,
            padding: "11px",
            borderRadius: 10,
            border: "none",
            background: saved
              ? `linear-gradient(135deg, #00aa44, ${t.neonGreen})`
              : `linear-gradient(135deg, #0066ff, ${t.neonBlue})`,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Save size={13} />
          {saving ? "SAVING..." : saved ? "✓ SAVED!" : "SAVE PROXY"}
        </button>
      </div>

      {/* Contact Admin */}
      <a
        href={adminContact}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          ...glass,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          textDecoration: "none",
          border: `1px solid ${t.border}`,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${t.neonBlue}15`,
            border: `1px solid ${t.neonBlue}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MessageCircle size={16} color={t.neonBlue} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
            Contact Admin
          </div>
          <div style={{ fontSize: 11, color: t.textMuted }}>
            For credits, support & keys
          </div>
        </div>
      </a>

      <RedeemKeyModal
        open={showRedeem}
        onClose={() => setShowRedeem(false)}
        token={token}
        onSuccess={() => onCreditsUpdated && onCreditsUpdated()}
      />

      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

function NotificationToggle({ label, desc, enabled, onChange, t, last }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: last ? "none" : `1px solid ${t.border}`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>
          {desc}
        </div>
      </div>
      <div
        onClick={() => onChange(!enabled)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: enabled ? t.neonGreen : t.inputBg,
          position: "relative",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: enabled ? 21 : 3,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
          }}
        />
      </div>
    </div>
  );
}
