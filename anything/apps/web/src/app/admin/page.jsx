"use client";
import { useState, useEffect } from "react";
import { Shield, ExternalLink } from "lucide-react";
import AdminLogin from "../../components/admin/AdminLogin";
import AdminOverview from "../../components/admin/AdminOverview";
import AdminUsers from "../../components/admin/AdminUsers";
import AdminKeys from "../../components/admin/AdminKeys";
import AdminActivity from "../../components/admin/AdminActivity";
import AdminGateways from "../../components/admin/AdminGateways";
import AdminBroadcast from "../../components/admin/AdminBroadcast";
import AdminBot from "../../components/admin/AdminBot";
import AdminLogs from "../../components/admin/AdminLogs";
import AdminSessions from "../../components/admin/AdminSessions";
import {
  LayoutDashboard,
  Users,
  Key,
  Activity,
  Settings2,
  LogOut,
  Radio,
  Bot,
  FileText,
  Monitor,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "keys", label: "Keys", icon: Key },
  { id: "gateways", label: "Gateways", icon: Settings2 },
  { id: "broadcast", label: "Broadcast", icon: Radio },
  { id: "bot", label: "Bot", icon: Bot },
  { id: "logs", label: "Logs", icon: FileText },
  { id: "sessions", label: "Sessions", icon: Monitor },
  { id: "activity", label: "Activity", icon: Activity },
];

const bg = "#0B0B0F";
const surface = "rgba(255,255,255,0.04)";
const border = "rgba(255,255,255,0.08)";
const blue = "#4DA3FF";
const red = "#FF453A";
const text = "#fff";
const muted = "rgba(255,255,255,0.5)";

export default function AdminPage() {
  const [token, setToken] = useState(null);
  const [tab, setTab] = useState("overview");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      setChecking(false);
      return;
    }
    const saved = localStorage.getItem("binchecker_admin_token");
    if (saved) {
      fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${saved}` },
      })
        .then((r) => {
          if (r.ok) setToken(saved);
          else localStorage.removeItem("binchecker_admin_token");
        })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const logout = () => {
    if (typeof window !== "undefined")
      localStorage.removeItem("binchecker_admin_token");
    setToken(null);
  };

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "2px solid rgba(77,163,255,0.2)",
            borderTop: `2px solid ${blue}`,
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        {/* Telegram notice */}
        <div
          style={{
            maxWidth: 400,
            width: "100%",
            marginBottom: 20,
            background: "rgba(77,163,255,0.07)",
            border: `1px solid ${blue}30`,
            borderRadius: 16,
            padding: "14px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <Shield
            size={18}
            color={blue}
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: text,
                marginBottom: 4,
              }}
            >
              Admin access via Telegram
            </div>
            <div style={{ fontSize: 12, color: muted, lineHeight: 1.5 }}>
              Open the Mini App inside Telegram — if your Telegram ID is in{" "}
              <code style={{ color: blue, fontSize: 11 }}>
                ADMIN_TELEGRAM_IDS
              </code>
              , the Admin tab appears automatically.
            </div>
          </div>
        </div>
        <AdminLogin onLogin={setToken} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: bg }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 14,
            marginBottom: 16,
            background: surface,
            backdropFilter: "blur(20px)",
            border: `1px solid ${border}`,
            borderRadius: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, #FF9F0A, #f60)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 14px rgba(255,159,10,0.4)",
              }}
            >
              <Shield size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: text }}>
                Admin Dashboard
              </div>
              <div
                style={{ fontSize: 10, color: muted, letterSpacing: "0.08em" }}
              >
                BIN CHECKER CONTROL
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: `${red}12`,
              border: `1px solid ${red}35`,
              borderRadius: 10,
              padding: "7px 12px",
              color: red,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <LogOut size={12} /> Logout
          </button>
        </div>

        {/* Tab Nav */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 14,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flexShrink: 0,
                padding: "9px 14px",
                borderRadius: 20,
                border:
                  tab === id ? `1px solid ${blue}50` : `1px solid ${border}`,
                background: tab === id ? `${blue}14` : surface,
                color: tab === id ? blue : muted,
                fontSize: 12,
                fontWeight: tab === id ? 600 : 400,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {tab === "overview" && <AdminOverview token={token} />}
        {tab === "users" && <AdminUsers token={token} />}
        {tab === "keys" && <AdminKeys token={token} />}
        {tab === "gateways" && <AdminGateways token={token} />}
        {tab === "broadcast" && <AdminBroadcast token={token} />}
        {tab === "bot" && <AdminBot token={token} />}
        {tab === "logs" && <AdminLogs token={token} />}
        {tab === "sessions" && <AdminSessions token={token} />}
        {tab === "activity" && <AdminActivity token={token} />}
      </div>
    </div>
  );
}
