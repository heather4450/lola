import { useState, useEffect, useCallback } from "react";
import { FileText, RefreshCw, Filter } from "lucide-react";

const C = {
  bg: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  text: "#fff",
  muted: "rgba(255,255,255,0.45)",
  sub: "rgba(255,255,255,0.25)",
  blue: "#4DA3FF",
  green: "#30D158",
  red: "#FF453A",
  yellow: "#FF9F0A",
  purple: "#BF5AF2",
};

const ACTION_COLORS = {
  user_join: C.green,
  user_login: C.blue,
  checker_hit: C.green,
  checker_run: C.blue,
  generator_run: C.purple,
  key_redeem: C.yellow,
  credits_spent: C.yellow,
  purchase: C.yellow,
  error: C.red,
  banned: C.red,
  unbanned: C.green,
};

const ACTION_ICONS = {
  user_join: "🆕",
  user_login: "🔐",
  checker_hit: "✅",
  checker_run: "🔍",
  generator_run: "⚙️",
  key_redeem: "🔑",
  credits_spent: "💳",
  purchase: "💰",
  error: "🚨",
  banned: "🚫",
  unbanned: "✅",
};

const ALL_ACTIONS = [
  "",
  "user_join",
  "user_login",
  "checker_hit",
  "checker_run",
  "generator_run",
  "key_redeem",
  "purchase",
  "error",
];

function card(extra = {}) {
  return {
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    ...extra,
  };
}

export default function AdminLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset });
      if (action) params.set("action", action);
      const res = await fetch(`/api/admin/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      setLogs(d.logs || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [token, action, offset]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const timeAgo = (ts) => {
    const s = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div>
      {/* Header + filter */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
          <Filter size={12} color={C.muted} />
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setOffset(0);
            }}
            style={{
              flex: 1,
              padding: "7px 10px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: "rgba(0,0,0,0.4)",
              color: C.text,
              fontSize: 12,
              outline: "none",
            }}
          >
            <option value="">All Actions</option>
            {ALL_ACTIONS.filter(Boolean).map((a) => (
              <option key={a} value={a}>
                {a.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={fetch_}
          disabled={loading}
          style={{
            padding: "7px 12px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,0.04)",
            color: C.muted,
            cursor: "pointer",
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <RefreshCw
            size={11}
            style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
          />
          Refresh
        </button>
      </div>

      {/* Total */}
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 10 }}>
        {total.toLocaleString()} total log entries
      </div>

      {/* Log rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {loading && logs.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: C.sub,
              padding: 30,
              fontSize: 12,
            }}
          >
            Loading…
          </div>
        ) : logs.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: C.sub,
              padding: 30,
              fontSize: 12,
            }}
          >
            No logs found
          </div>
        ) : (
          logs.map((log) => {
            const color = ACTION_COLORS[log.action] || C.muted;
            const icon = ACTION_ICONS[log.action] || "📌";
            const meta =
              log.metadata && typeof log.metadata === "object"
                ? Object.entries(log.metadata)
                    .slice(0, 3)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("  ·  ")
                : "";
            return (
              <div key={log.id} style={{ ...card({ padding: "10px 12px" }) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color,
                          background: `${color}15`,
                          border: `1px solid ${color}30`,
                          borderRadius: 6,
                          padding: "2px 7px",
                        }}
                      >
                        {log.action.replace(/_/g, " ").toUpperCase()}
                      </span>
                      {log.telegram_id && (
                        <span style={{ fontSize: 10, color: C.sub }}>
                          ID:{" "}
                          <code style={{ color: C.muted }}>
                            {log.telegram_id}
                          </code>
                        </span>
                      )}
                      {(log.username || log.first_name) && (
                        <span style={{ fontSize: 10, color: C.sub }}>
                          @{log.username || log.first_name}
                        </span>
                      )}
                      {log.ip_address && (
                        <span style={{ fontSize: 10, color: C.sub }}>
                          🌐 {log.ip_address}
                        </span>
                      )}
                    </div>
                    {meta && (
                      <div
                        style={{
                          fontSize: 10,
                          color: C.sub,
                          marginTop: 3,
                          fontFamily: "monospace",
                        }}
                      >
                        {meta}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: C.sub, flexShrink: 0 }}>
                    {timeAgo(log.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 14,
          }}
        >
          <button
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            style={{
              padding: "7px 16px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background:
                offset === 0 ? "transparent" : "rgba(255,255,255,0.05)",
              color: offset === 0 ? C.sub : C.text,
              fontSize: 12,
              cursor: offset === 0 ? "not-allowed" : "pointer",
            }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 11, color: C.sub, alignSelf: "center" }}>
            {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
          </span>
          <button
            disabled={offset + LIMIT >= total}
            onClick={() => setOffset(offset + LIMIT)}
            style={{
              padding: "7px 16px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background:
                offset + LIMIT >= total
                  ? "transparent"
                  : "rgba(255,255,255,0.05)",
              color: offset + LIMIT >= total ? C.sub : C.text,
              fontSize: 12,
              cursor: offset + LIMIT >= total ? "not-allowed" : "pointer",
            }}
          >
            Next →
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
