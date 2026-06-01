import { useState } from "react";
import {
  BarChart3,
  Users,
  Key,
  Activity,
  Shield,
  Radio,
  Bot,
  FileText,
  Monitor,
} from "lucide-react";
import AdminOverview from "./AdminOverview";
import AdminUsers from "./AdminUsers";
import AdminKeys from "./AdminKeys";
import AdminActivity from "./AdminActivity";
import AdminGateways from "./AdminGateways";
import AdminBroadcast from "./AdminBroadcast";
import AdminBot from "./AdminBot";
import AdminLogs from "./AdminLogs";
import AdminSessions from "./AdminSessions";

const C = {
  blue: "#4DA3FF",
  yellow: "#FF9F0A",
  border: "rgba(255,255,255,0.08)",
  muted: "rgba(255,255,255,0.4)",
  text: "#fff",
};

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "keys", label: "Keys", icon: Key },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "gateways", label: "Gateways", icon: Shield },
  { id: "broadcast", label: "Broadcast", icon: Radio },
  { id: "bot", label: "Bot", icon: Bot },
  { id: "logs", label: "Logs", icon: FileText },
  { id: "sessions", label: "Sessions", icon: Monitor },
];

export default function AdminPanel({ token, user }) {
  const [tab, setTab] = useState("overview");

  return (
    <div style={{ padding: "16px 14px 20px", maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: "linear-gradient(135deg, #FF9F0A, #ff6600)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(255,159,10,0.4)",
          }}
        >
          <Shield size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>
            Admin Panel
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>
            Full access granted
          </div>
        </div>
      </div>

      {/* Tab strip — scrollable */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          overflowX: "auto",
          paddingBottom: 2,
          scrollbarWidth: "none",
        }}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flexShrink: 0,
                padding: "8px 14px",
                borderRadius: 20,
                border: active
                  ? `1px solid ${C.blue}50`
                  : `1px solid ${C.border}`,
                background: active ? `${C.blue}14` : "rgba(255,255,255,0.04)",
                color: active ? C.blue : C.muted,
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.18s ease",
              }}
            >
              <Icon size={12} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === "overview" && <AdminOverview token={token} />}
      {tab === "users" && <AdminUsers token={token} />}
      {tab === "keys" && <AdminKeys token={token} />}
      {tab === "activity" && <AdminActivity token={token} />}
      {tab === "gateways" && <AdminGateways token={token} />}
      {tab === "broadcast" && <AdminBroadcast token={token} />}
      {tab === "bot" && <AdminBot token={token} />}
      {tab === "logs" && <AdminLogs token={token} />}
      {tab === "sessions" && <AdminSessions token={token} />}
    </div>
  );
}
