import { useState, useEffect, useRef } from "react";
import {
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  X,
  RefreshCw,
} from "lucide-react";

const C = {
  border: "rgba(255,255,255,0.08)",
  text: "#fff",
  muted: "rgba(255,255,255,0.45)",
  sub: "rgba(255,255,255,0.25)",
  blue: "#4DA3FF",
  green: "#30D158",
  red: "#FF453A",
  yellow: "#FF9F0A",
};

function glassCard(extra = {}) {
  return {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    ...extra,
  };
}

function StatCard({ label, value, color, icon: Icon, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...glassCard({
          borderRadius: 16,
          flex: 1,
          border: `1px solid ${active ? color + "40" : C.border}`,
          background: active ? `${color}0e` : "rgba(255,255,255,0.04)",
        }),
        padding: "14px 8px",
        cursor: "pointer",
        boxShadow: active ? `0 0 20px ${color}25` : "none",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          marginBottom: 8,
          justifyContent: "center",
        }}
      >
        <Icon size={13} color={active ? color : C.muted} />
        <span
          style={{
            fontSize: 9,
            color: active ? color : C.muted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: active ? color : C.text,
          letterSpacing: "-0.5px",
        }}
      >
        {(value || 0).toLocaleString()}
      </div>
    </button>
  );
}

function SessionRow({ session, onClick }) {
  const name =
    session.first_name || session.username || `tg:${session.telegram_id}`;
  const time = new Date(session.created_at).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const hitRate =
    session.lines_checked > 0
      ? ((session.lines_good / session.lines_checked) * 100).toFixed(1)
      : "0.0";
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "11px 14px",
        borderBottom: `1px solid rgba(255,255,255,0.04)`,
        background: "transparent",
        border: "none",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
            {name}
          </span>
          <span
            style={{
              padding: "1px 6px",
              borderRadius: 5,
              fontSize: 9,
              fontWeight: 700,
              background: `${C.green}15`,
              border: `1px solid ${C.green}30`,
              color: C.green,
            }}
          >
            {hitRate}%
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, fontSize: 10, color: C.muted }}>
          <span>📊 {session.lines_checked} checked</span>
          <span style={{ color: C.green }}>✓ {session.lines_good}</span>
          <span style={{ color: C.red }}>✗ {session.lines_bad}</span>
          {session.credits_used > 0 && (
            <span style={{ color: C.yellow }}>-{session.credits_used}cr</span>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 3,
        }}
      >
        <span style={{ fontSize: 9, color: C.sub }}>{time}</span>
        <ChevronRight size={12} color={C.sub} />
      </div>
    </button>
  );
}

function SessionModal({ session, onClose }) {
  if (!session) return null;
  const name =
    session.first_name || session.username || `tg:${session.telegram_id}`;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...glassCard({ borderRadius: "24px 24px 0 0" }),
          maxWidth: 480,
          width: "100%",
          padding: "24px 20px",
          paddingBottom: 40,
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
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
              {name}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              {new Date(session.created_at).toLocaleString()}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: `1px solid ${C.border}`,
              background: "rgba(255,255,255,0.05)",
              color: C.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            { label: "Total", value: session.lines_checked, color: C.blue },
            { label: "Approved", value: session.lines_good, color: C.green },
            { label: "Declined", value: session.lines_bad, color: C.red },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                flex: 1,
                padding: "12px 8px",
                textAlign: "center",
                background: `${color}0e`,
                border: `1px solid ${color}30`,
                borderRadius: 14,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color }}>
                {value || 0}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: color + "99",
                  letterSpacing: "0.07em",
                  marginTop: 3,
                  textTransform: "uppercase",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              flex: 1,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 12,
              border: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: C.muted,
                letterSpacing: "0.07em",
                marginBottom: 4,
              }}
            >
              CREDITS USED
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.yellow }}>
              -{session.credits_used || 0}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 12,
              border: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: C.muted,
                letterSpacing: "0.07em",
                marginBottom: 4,
              }}
            >
              HIT RATE
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.green }}>
              {session.lines_checked > 0
                ? ((session.lines_good / session.lines_checked) * 100).toFixed(
                    1,
                  )
                : "0.0"}
              %
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminActivity({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [selected, setSelected] = useState(null);
  const intervalRef = useRef(null);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/activity", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 10000);
    return () => clearInterval(intervalRef.current);
  }, [token]);

  const sessions = data?.sessions || [];
  const stats = data?.stats || {};

  const filtered = sessions.filter((s) => {
    if (!activeFilter) return true;
    if (activeFilter === "approved") return s.lines_good > 0;
    if (activeFilter === "declined") return s.lines_bad > 0;
    return true;
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 12,
        }}
      >
        <button
          onClick={load}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: "6px 12px",
            color: C.muted,
            fontSize: 11,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
          Loading…
        </div>
      ) : (
        <>
          {/* Stat cards — click to filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <StatCard
              label="Total Cards"
              value={stats.total_cards}
              color={C.blue}
              icon={BarChart3}
              active={activeFilter === "total"}
              onClick={() =>
                setActiveFilter((f) => (f === "total" ? null : "total"))
              }
            />
            <StatCard
              label="Approved"
              value={stats.total_approved}
              color={C.green}
              icon={CheckCircle}
              active={activeFilter === "approved"}
              onClick={() =>
                setActiveFilter((f) => (f === "approved" ? null : "approved"))
              }
            />
            <StatCard
              label="Declined"
              value={stats.total_declined}
              color={C.red}
              icon={XCircle}
              active={activeFilter === "declined"}
              onClick={() =>
                setActiveFilter((f) => (f === "declined" ? null : "declined"))
              }
            />
          </div>

          {activeFilter && (
            <div
              style={{
                padding: "7px 12px",
                marginBottom: 10,
                borderRadius: 10,
                background: "rgba(77,163,255,0.08)",
                border: "1px solid rgba(77,163,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 11, color: C.blue }}>
                Showing: {activeFilter} · {filtered.length} sessions
              </span>
              <button
                onClick={() => setActiveFilter(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: C.blue,
                  cursor: "pointer",
                }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div
            style={{
              ...glassCard({
                borderRadius: 18,
                padding: 0,
                overflow: "hidden",
              }),
            }}
          >
            <div
              style={{
                padding: "11px 14px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Clock size={12} color={C.muted} />
              <span
                style={{
                  fontSize: 11,
                  color: C.muted,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                Checker Sessions · {filtered.length}
              </span>
            </div>
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "32px 0",
                  textAlign: "center",
                  color: C.muted,
                  fontSize: 13,
                }}
              >
                {activeFilter
                  ? `No sessions with ${activeFilter}`
                  : "No sessions yet"}
              </div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {filtered.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    onClick={() => setSelected(s)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {selected && (
        <SessionModal session={selected} onClose={() => setSelected(null)} />
      )}

      <style>{`@keyframes fadeIn { from{opacity:0}to{opacity:1} }`}</style>
    </div>
  );
}
