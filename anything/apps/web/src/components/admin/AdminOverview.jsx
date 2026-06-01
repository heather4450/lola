import { useState, useEffect } from "react";
import { Users, Shield, Zap, Key, TrendingUp, AlertCircle } from "lucide-react";

const C = {
  bg: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  text: "#fff",
  muted: "rgba(255,255,255,0.5)",
  sub: "rgba(255,255,255,0.3)",
  neonBlue: "#00b4ff",
  neonGreen: "#00ff88",
  neonRed: "#ff3b5c",
  neonYellow: "#ffb800",
  neonPurple: "#b06cff",
};

function MetricCard({ icon, label, value, color, sub }) {
  return (
    <div
      style={{
        background: `${color}10`,
        border: `1px solid ${color}30`,
        borderRadius: 14,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        {icon}
        <span
          style={{
            fontSize: 11,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color,
          letterSpacing: "-0.5px",
        }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

export default function AdminOverview({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setStats(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div
        style={{
          background: "rgba(255,59,92,0.1)",
          border: "1px solid rgba(255,59,92,0.3)",
          borderRadius: 12,
          padding: 16,
          color: C.neonRed,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <AlertCircle size={18} /> {error}
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: C.muted,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Platform Overview
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <MetricCard
          icon={<Users size={14} color={C.neonBlue} />}
          label="Total Users"
          value={stats.users.total}
          color={C.neonBlue}
          sub={`${stats.users.activeToday} active today`}
        />
        <MetricCard
          icon={<Shield size={14} color={C.neonGreen} />}
          label="Total Hits"
          value={stats.users.totalHits}
          color={C.neonGreen}
          sub={`${stats.checker.totalChecked.toLocaleString()} checked`}
        />
        <MetricCard
          icon={<Zap size={14} color={C.neonPurple} />}
          label="Generated"
          value={stats.generator.totalGenerated}
          color={C.neonPurple}
          sub={`${stats.generator.sessions} sessions`}
        />
        <MetricCard
          icon={<Key size={14} color={C.neonYellow} />}
          label="Active Keys"
          value={stats.keys.active}
          color={C.neonYellow}
          sub={`${stats.keys.totalUses} redemptions`}
        />
      </div>

      <div
        style={{
          background: `linear-gradient(135deg, ${C.neonBlue}10, ${C.neonPurple}10)`,
          border: `1px solid ${C.neonBlue}30`,
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 12, color: C.muted }}>Premium Users</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.neonBlue }}>
            {stats.users.premium}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 12, color: C.muted }}>Banned Users</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.neonRed }}>
            {stats.users.banned}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 12, color: C.muted }}>
            Credits in Circulation
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.neonGreen }}>
            {stats.users.totalCredits.toLocaleString()}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: C.muted }}>
            Credits Issued via Keys
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.neonYellow }}>
            {stats.keys.creditsIssued.toLocaleString()}
          </span>
        </div>
      </div>

      <div
        style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: C.muted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <TrendingUp size={12} /> Checker Performance
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: 10,
              background: `${C.neonGreen}10`,
              borderRadius: 10,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: C.neonGreen }}>
              {stats.checker.totalGood.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
              GOOD
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: 10,
              background: `${C.neonRed}10`,
              borderRadius: 10,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: C.neonRed }}>
              {stats.checker.totalBad.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
              BAD
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: 10,
              background: `${C.neonBlue}10`,
              borderRadius: 10,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: C.neonBlue }}>
              {stats.checker.sessions.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
              SESSIONS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
