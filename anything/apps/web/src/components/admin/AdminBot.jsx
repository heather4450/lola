import { useState, useEffect } from "react";
import { Bot, CheckCircle, AlertCircle, RefreshCw, Zap } from "lucide-react";

const C = {
  blue: "#4DA3FF",
  green: "#34C759",
  red: "#FF453A",
  yellow: "#FF9F0A",
  border: "rgba(255,255,255,0.08)",
  muted: "rgba(255,255,255,0.4)",
  card: "rgba(255,255,255,0.05)",
  text: "#fff",
};

const CMD_LIST = [
  { cmd: "/start", desc: "Welcome message + open app button (all users)" },
  { cmd: "/help", desc: "Show available commands" },
  { cmd: "/stats", desc: "Platform stats (admin only)" },
  { cmd: "/broadcast <msg>", desc: "Send announcement to all users (admin)" },
  { cmd: "/addcredits <userId> <n>", desc: "Add credits to user (admin)" },
  { cmd: "/ban <userId>", desc: "Ban a user (admin)" },
  { cmd: "/unban <userId>", desc: "Unban a user (admin)" },
  { cmd: "/userinfo <userId>", desc: "Get user details (admin)" },
];

export default function AdminBot({ token }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/bot/setup", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ configured: false, error: "Could not reach server" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSetup = async () => {
    setSetting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/bot/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMsg({
          ok: true,
          text: `✅ Webhook registered at:\n${data.webhookUrl}`,
        });
        fetchStatus();
      } else {
        setMsg({ ok: false, text: data.error || "Setup failed" });
      }
    } catch {
      setMsg({ ok: false, text: "Request failed" });
    } finally {
      setSetting(false);
    }
  };

  const webhookActive =
    status?.webhook?.url && !status?.webhook?.last_error_message;
  const appUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_CREATE_APP_URL || window.location.origin
      : "";
  const expectedWebhook = `${appUrl}/api/bot/webhook`;
  const webhookMatches = status?.webhook?.url === expectedWebhook;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Bot identity card */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #4DA3FF22, #4DA3FF44)",
              border: `1px solid #4DA3FF44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bot size={18} color={C.blue} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
              {loading
                ? "Loading…"
                : status?.bot
                  ? `@${status.bot.username}`
                  : "Bot not connected"}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              {status?.bot?.first_name || "Set TELEGRAM_BOT_TOKEN to connect"}
            </div>
          </div>

          <button
            onClick={fetchStatus}
            disabled={loading}
            style={{
              marginLeft: "auto",
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "4px 8px",
              cursor: "pointer",
              color: C.muted,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
            }}
          >
            <RefreshCw
              size={11}
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />
            Refresh
          </button>
        </div>

        {/* Webhook status row */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 10,
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {webhookActive && webhookMatches ? (
              <CheckCircle size={14} color={C.green} />
            ) : (
              <AlertCircle size={14} color={webhookActive ? C.yellow : C.red} />
            )}
            <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>
              {loading
                ? "Checking webhook…"
                : webhookActive && webhookMatches
                  ? "Webhook active & correct"
                  : webhookActive && !webhookMatches
                    ? "Webhook URL mismatch — re-register"
                    : "Webhook not set"}
            </span>
          </div>

          {status?.webhook?.url && (
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                wordBreak: "break-all",
                fontFamily: "monospace",
              }}
            >
              {status.webhook.url}
            </div>
          )}

          {status?.webhook?.last_error_message && (
            <div style={{ fontSize: 10, color: C.red }}>
              ⚠️ {status.webhook.last_error_message}
            </div>
          )}

          {status?.webhook?.pending_update_count > 0 && (
            <div style={{ fontSize: 10, color: C.yellow }}>
              ⏳ {status.webhook.pending_update_count} pending updates
            </div>
          )}
        </div>
      </div>

      {/* Required env vars */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: C.muted,
            marginBottom: 10,
          }}
        >
          REQUIRED ENV VARIABLES
        </div>
        {[
          {
            key: "TELEGRAM_BOT_TOKEN",
            note: "From @BotFather — never shown in browser",
            secret: true,
          },
          {
            key: "TELEGRAM_WEBHOOK_SECRET",
            note: "Any random string you choose (32+ chars)",
            secret: true,
          },
          {
            key: "ADMIN_TELEGRAM_IDS",
            note: "Your Telegram numeric ID(s), comma-separated",
            secret: true,
          },
          {
            key: "NEXT_PUBLIC_ADMIN_CONTACT_URL",
            note: "Public link — safe to expose",
            secret: false,
          },
        ].map(({ key, note, secret }) => (
          <div
            key={key}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: secret ? C.yellow : C.green,
                marginTop: 5,
                flexShrink: 0,
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: C.text,
                  background: "rgba(255,255,255,0.06)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  display: "inline-block",
                  marginBottom: 2,
                }}
              >
                {key}
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>{note}</div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                fontSize: 9,
                padding: "2px 5px",
                borderRadius: 4,
                background: secret
                  ? "rgba(255,159,10,0.12)"
                  : "rgba(52,199,89,0.12)",
                color: secret ? C.yellow : C.green,
                flexShrink: 0,
              }}
            >
              {secret ? "SERVER ONLY" : "PUBLIC"}
            </div>
          </div>
        ))}
      </div>

      {/* Register webhook button */}
      <button
        onClick={handleSetup}
        disabled={setting || loading}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: 12,
          border: "none",
          background:
            setting || loading
              ? "rgba(77,163,255,0.2)"
              : "linear-gradient(135deg, #4DA3FF, #007AFF)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          cursor: setting || loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Zap size={15} />
        {setting ? "Registering…" : "Register / Update Webhook"}
      </button>

      {msg && (
        <div
          style={{
            background: msg.ok ? "rgba(52,199,89,0.1)" : "rgba(255,69,58,0.1)",
            border: `1px solid ${msg.ok ? C.green : C.red}30`,
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 12,
            color: msg.ok ? C.green : C.red,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Command reference */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: C.muted,
            marginBottom: 10,
          }}
        >
          BOT COMMANDS
        </div>
        {CMD_LIST.map(({ cmd, desc }) => (
          <div key={cmd} style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                color: C.blue,
                marginBottom: 2,
              }}
            >
              {cmd}
            </div>
            <div style={{ fontSize: 10, color: C.muted }}>{desc}</div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
