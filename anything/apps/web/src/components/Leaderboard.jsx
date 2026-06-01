import { useState, useEffect } from "react";
import { Trophy, Crown, Medal, TrendingUp } from "lucide-react";
import { useTheme } from "./ThemeContext";

const PERIODS = [
  { id: "all", label: "All Time" },
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
];

function MedalIcon({ rank, color }) {
  if (rank === 1) return <Crown size={18} color={color} />;
  if (rank === 2 || rank === 3) return <Medal size={16} color={color} />;
  return <span style={{ fontSize: 12, fontWeight: 700, color }}>#{rank}</span>;
}

function rankColor(rank, t) {
  if (rank === 1) return "#FFD700";
  if (rank === 2) return "#C0C0C0";
  if (rank === 3) return "#CD7F32";
  return t.textMuted;
}

export default function Leaderboard({
  token,
  currentUserId,
  compact = false,
  limit = 50,
}) {
  const { theme: t } = useTheme();
  const [period, setPeriod] = useState("all");
  const [data, setData] = useState({ leaderboard: [], myRank: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`/api/leaderboard?period=${period}&limit=${limit}`, { headers })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period, token, limit]);

  const top = compact ? data.leaderboard.slice(0, 5) : data.leaderboard;

  return (
    <div style={{ animation: "fadeInUp 0.3s ease" }}>
      {!compact && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              color: t.textMuted,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Leaderboard
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: t.text,
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Trophy size={22} color="#FFD700" /> Top Hunters
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 10,
              border:
                period === p.id
                  ? `1px solid ${t.neonBlue}`
                  : `1px solid ${t.border}`,
              background: period === p.id ? `${t.neonBlue}1a` : t.surface,
              color: period === p.id ? t.neonBlue : t.textMuted,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {data.myRank && (
        <div
          style={{
            background: `linear-gradient(135deg, ${t.neonBlue}20, ${t.neonPurple}20)`,
            border: `1px solid ${t.neonBlue}40`,
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={14} color={t.neonBlue} />
            <span style={{ fontSize: 12, color: t.textMuted }}>Your Rank</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: t.neonBlue }}>
              #{data.myRank.rank}
            </span>
            <span style={{ fontSize: 12, color: t.textMuted }}>
              {data.myRank.hits} hits
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: t.textMuted }}>
          Loading...
        </div>
      ) : top.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: t.textMuted,
            fontSize: 13,
          }}
        >
          🏆 No hits yet. Be the first!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {top.map((u) => {
            const isMe = u.id === currentUserId;
            const c = rankColor(u.rank, t);
            const podium = u.rank <= 3;
            return (
              <div
                key={u.id}
                style={{
                  background: isMe
                    ? `linear-gradient(135deg, ${t.neonBlue}18, ${t.neonPurple}18)`
                    : podium
                      ? `${c}10`
                      : t.surface,
                  border: isMe
                    ? `1px solid ${t.neonBlue}50`
                    : podium
                      ? `1px solid ${c}40`
                      : `1px solid ${t.border}`,
                  borderRadius: 12,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  boxShadow:
                    u.rank === 1 ? "0 0 18px rgba(255,215,0,0.25)" : "none",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: podium ? `${c}20` : t.surfaceStrong,
                    border: `1px solid ${podium ? c + "50" : t.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MedalIcon rank={u.rank} color={c} />
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${t.neonBlue}, ${t.neonPurple})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {u.photo_url ? (
                    <img
                      src={u.photo_url}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    (u.first_name?.[0] || u.username?.[0] || "U").toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: t.text,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {u.first_name || u.username || "User"}
                    </span>
                    {u.is_premium && (
                      <span style={{ fontSize: 9, color: "#f59e0b" }}>★</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: t.textSub }}>
                    {u.checked > 0 ? `${u.hitRate}% hit rate` : "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: podium ? c : t.neonGreen,
                    }}
                  >
                    {u.hits.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: t.textSub,
                      letterSpacing: "0.08em",
                    }}
                  >
                    HITS
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
