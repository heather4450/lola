"use client";
import { useState, useEffect } from "react";
import { Home, User, Settings, Shield } from "lucide-react";
import CheckerTab from "../components/CheckerTab";
import HomeTab from "../components/HomeTab";
import ProfileTab from "../components/ProfileTab";
import SettingsTab from "../components/SettingsTab";
import AdminPanel from "../components/admin/AdminPanel";
import NotificationBell from "../components/NotificationBell";
import { ThemeProvider, useTheme } from "../components/ThemeContext";

function decodeJWTPayload(token) {
  try {
    const b64 = token.split(".")[1];
    return JSON.parse(atob(b64.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

// ── Outside-Telegram restriction screen ─────────────────────────────────────
function TelegramOnlyScreen() {
  const botUrl = process.env.NEXT_PUBLIC_BOT_USERNAME
    ? `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}`
    : "https://t.me/";

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at 50% 0%, #0d1a2e 0%, #080810 70%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: "linear-gradient(135deg, #229ED9, #1a7db5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          boxShadow: "0 0 40px rgba(34,158,217,0.35)",
          fontSize: 36,
        }}
      >
        ✈️
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#fff",
          textAlign: "center",
          marginBottom: 10,
          letterSpacing: "-0.02em",
        }}
      >
        Open in Telegram
      </div>

      <div
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.45)",
          textAlign: "center",
          marginBottom: 32,
          maxWidth: 300,
          lineHeight: 1.6,
        }}
      >
        BIN Checker is a Telegram Mini App. It must be opened through the
        Telegram bot to authenticate securely.
      </div>

      <a
        href={botUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 28px",
          borderRadius: 14,
          background: "linear-gradient(135deg, #229ED9, #1a7db5)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
          textDecoration: "none",
          boxShadow: "0 4px 20px rgba(34,158,217,0.4)",
          letterSpacing: "0.02em",
        }}
      >
        Open Bot in Telegram
      </a>

      <div
        style={{
          marginTop: 28,
          padding: "12px 18px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: 11,
          color: "rgba(255,255,255,0.25)",
          textAlign: "center",
        }}
      >
        🔒 Authentication requires Telegram identity.
        <br />
        No passwords or registration needed.
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0B0B0F",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "2px solid rgba(77,163,255,0.12)",
          borderTop: "2px solid #4DA3FF",
          animation: "spin 0.9s cubic-bezier(0.4,0,0.2,1) infinite",
        }}
      />
      <div
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.2em",
        }}
      >
        LOADING
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}

function FloatingDock({ tabs, activeTab, setActiveTab }) {
  const { theme: t } = useTheme();
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: t.navBg,
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: `1px solid ${t.border}`,
        borderRadius: 40,
        padding: "8px 10px",
        boxShadow:
          "0 8px 40px rgba(0,0,0,0.35), inset 0 0 0 0.5px rgba(255,255,255,0.04)",
        zIndex: 200,
      }}
    >
      {tabs.map(({ id, icon: Icon, label, color }) => {
        const active = activeTab === id;
        const ac = color || t.neonBlue;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "8px 15px",
              borderRadius: 30,
              border: "none",
              background: active ? `${ac}18` : "transparent",
              color: active ? ac : t.textSub,
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: active ? `0 0 14px ${ac}30` : "none",
            }}
          >
            <Icon size={19} strokeWidth={active ? 2.2 : 1.7} />
            <span
              style={{
                fontSize: 9.5,
                fontWeight: active ? 600 : 400,
                letterSpacing: "0.03em",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AppShell() {
  const { theme: t } = useTheme();
  const [activeTab, setActiveTab] = useState("checker");
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notInTelegram, setNotInTelegram] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const tg =
          typeof window !== "undefined" ? window.Telegram?.WebApp : null;

        // ── Outside-Telegram detection ──────────────────────────────────────
        // If no Telegram WebApp context in production → show restriction screen
        const isProduction =
          process.env.NEXT_PUBLIC_CREATE_ENV === "PRODUCTION";
        if (!tg && isProduction) {
          setNotInTelegram(true);
          setLoading(false);
          return;
        }

        if (tg) {
          tg.ready();
          tg.expand();
        }

        const tgUser = tg?.initDataUnsafe?.user || null;
        const initData = tg?.initData || "";

        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData, user: tgUser }),
        });

        if (res.status === 403) {
          // Server also rejects non-Telegram access in production
          setNotInTelegram(true);
          setLoading(false);
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setToken(data.token);
          setUser(data.user);
          const payload = decodeJWTPayload(data.token);
          setIsAdmin(!!(payload?.isAdmin || data.user?.isAdmin));
          if (typeof window !== "undefined") {
            localStorage.setItem("binchecker_token", data.token);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const baseTabs = [
    { id: "checker", icon: Home, label: "Home" },
    { id: "profile", icon: User, label: "Profile" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];
  const tabs = isAdmin
    ? [
        ...baseTabs,
        { id: "admin", icon: Shield, label: "Admin", color: "#FF9F0A" },
      ]
    : baseTabs;

  if (loading) return <LoadingScreen />;
  if (notInTelegram) return <TelegramOnlyScreen />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bg,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Notification bell — fixed top-right */}
      {token && (
        <div
          style={{
            position: "fixed",
            top: 14,
            right: 14,
            zIndex: 300,
          }}
        >
          <NotificationBell token={token} />
        </div>
      )}

      <div style={{ paddingBottom: 100 }}>
        {activeTab === "checker" && (
          <CheckerTab token={token} user={user} isAdmin={isAdmin} />
        )}
        {activeTab === "profile" && <ProfileTab user={user} token={token} />}
        {activeTab === "settings" && (
          <SettingsTab token={token} isAdmin={isAdmin} />
        )}
        {activeTab === "admin" && isAdmin && (
          <AdminPanel token={token} user={user} />
        )}
      </div>
      <FloatingDock
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
