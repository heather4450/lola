import { useState, useEffect, useCallback } from "react";
import { Monitor, RefreshCw } from "lucide-react";

const C = {
  border: "rgba(255,255,255,0.08)",
  text: "#fff",
  muted: "rgba(255,255,255,0.45)",
  sub: "rgba(255,255,255,0.25)",
  blue: "#4DA3FF",
  green: "#30D158",
};

const DEVICE_ICON = {
  iOS: "🍎",
  Android: "🤖",
  Windows: "🖥",
  macOS: "🍏",
  Unknown: "📱",
};

function card(extra = {}) {
  return {
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    ...extra,
  };
}

export default function AdminSessions({ token }) {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/sessions?limit=${LIMIT}&offset=${offset}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const d = await res.json();
      setSessions(d.sessions || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [token, offset]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const fmt = (ts) => (ts ? new Date(ts).toLocaleString() : "N/A");

  const timeAgo = (ts) => {
    const s = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 11, color: C.sub }}>
          {total.toLocaleString()} total sessions
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

      {/* Session rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {loading && sessions.length === 0 ? (
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
        ) : sessions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: C.sub,
              padding: 30,
              fontSize: 12,
            }}
          >
            No sessions yet
          </div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} style={{ ...card({ padding: "10px 12px" }) }}>
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>
                  {DEVICE_ICON[s.device] || "📱"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{ fontSize: 13, fontWeight: 600, color: C.text }}
                    >
                      {s.first_name || "Unknown"}
                    </span>
                    {s.username && (
                      <span style={{ fontSize: 11, color: C.muted }}>
                        @{s.username}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 10,
                        color: C.blue,
                        background: `${C.blue}15`,
                        border: `1px solid ${C.blue}30`,
                        borderRadius: 5,
                        padding: "1px 6px",
                      }}
                    >
                      {s.device || "Unknown"}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: C.sub, marginTop: 3 }}>
                    🆔 Telegram:{" "}
                    <code style={{ color: C.muted }}>{s.telegram_id}</code>
                    {s.ip_address && (
                      <>
                        {" "}
                        &nbsp;·&nbsp; 🌐{" "}
                        <code style={{ color: C.muted }}>{s.ip_address}</code>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: C.sub }}>
                    {timeAgo(s.login_time)}
                  </div>
                  <div style={{ fontSize: 9, color: C.sub, marginTop: 2 }}>
                    {fmt(s.login_time)}
                  </div>
                </div>
              </div>
            </div>
          ))
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
