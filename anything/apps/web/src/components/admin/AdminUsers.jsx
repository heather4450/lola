import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Minus, Star, Ban, Check, X } from "lucide-react";

const C = {
  bg: "rgba(255,255,255,0.03)",
  bgStrong: "rgba(255,255,255,0.06)",
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

function UserCard({ user, token, onAction }) {
  const [editing, setEditing] = useState(false);
  const [creditDelta, setCreditDelta] = useState("");
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const name = user.first_name
    ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}`
    : user.username || "User";

  const doAction = useCallback(
    async (action, payload = {}) => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/user-action", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: user.id, action, payload }),
        });
        if (res.ok) onAction && onAction();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [user.id, token, onAction],
  );

  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${user.is_banned ? C.neonRed + "30" : C.border}`,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: editing ? 10 : 0,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.neonBlue}, ${C.neonPurple})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {user.photo_url ? (
            <img
              src={user.photo_url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            (name[0] || "U").toUpperCase()
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.text,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </span>
            {user.is_premium && (
              <Star size={10} color={C.neonYellow} fill={C.neonYellow} />
            )}
            {user.is_banned && <Ban size={10} color={C.neonRed} />}
          </div>
          <div style={{ fontSize: 10, color: C.sub, display: "flex", gap: 8 }}>
            <span>ID: {user.telegram_id}</span>
            {user.username && <span>@{user.username}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.neonBlue }}>
            {user.credits} cr
          </div>
          <div style={{ fontSize: 9, color: C.muted }}>
            {user.total_hits || 0} hits
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            background: editing ? C.neonRed + "20" : C.bgStrong,
            border: `1px solid ${editing ? C.neonRed + "40" : C.border}`,
            borderRadius: 8,
            padding: "5px 8px",
            color: editing ? C.neonRed : C.muted,
            fontSize: 10,
            cursor: "pointer",
          }}
        >
          {editing ? <X size={12} /> : "EDIT"}
        </button>
      </div>

      {editing && (
        <div style={{ paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <input
              type="number"
              value={creditDelta}
              onChange={(e) => setCreditDelta(e.target.value)}
              placeholder="±credits"
              style={{
                flex: 1,
                padding: "6px 10px",
                background: "rgba(0,0,0,0.4)",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.text,
                fontSize: 12,
                outline: "none",
              }}
            />
            <button
              onClick={() => {
                doAction("add_credits", { amount: parseInt(creditDelta) });
                setCreditDelta("");
              }}
              disabled={!creditDelta || loading}
              style={{
                padding: "6px 10px",
                background: `${C.neonGreen}20`,
                border: `1px solid ${C.neonGreen}40`,
                borderRadius: 8,
                color: C.neonGreen,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Plus size={11} /> ADD
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 0)}
              placeholder="days"
              style={{
                width: 60,
                padding: "6px 8px",
                background: "rgba(0,0,0,0.4)",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.text,
                fontSize: 11,
                outline: "none",
              }}
            />
            <ActionBtn
              label="GRANT PREMIUM"
              color={C.neonYellow}
              onClick={() => doAction("grant_premium", { days })}
            />
            <ActionBtn
              label="REVOKE"
              color="#FF6B35"
              onClick={() => doAction("revoke_premium")}
            />
            {user.is_banned ? (
              <ActionBtn
                label="UNBAN"
                color={C.neonGreen}
                icon={<Check size={11} />}
                onClick={() => doAction("unban")}
              />
            ) : (
              <ActionBtn
                label="BAN"
                color={C.neonRed}
                icon={<Ban size={11} />}
                onClick={() => doAction("ban")}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, color, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 10px",
        background: `${color}15`,
        border: `1px solid ${color}40`,
        borderRadius: 8,
        color: color,
        fontSize: 10,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 3,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export default function AdminUsers({ token }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("last_active");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ search, sort, limit: "100" });
    fetch(`/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, search, sort, refresh]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.muted,
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, or ID"
            style={{
              width: "100%",
              padding: "9px 14px 9px 34px",
              background: "rgba(0,0,0,0.4)",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              color: C.text,
              fontSize: 12,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{
            padding: "9px 10px",
            background: "rgba(0,0,0,0.4)",
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            color: C.text,
            fontSize: 12,
            outline: "none",
          }}
        >
          <option value="last_active">Last Active</option>
          <option value="hits">Most Hits</option>
          <option value="credits">Most Credits</option>
          <option value="created">Newest</option>
        </select>
      </div>

      <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
        {loading
          ? "Loading..."
          : `${users.length} user${users.length !== 1 ? "s" : ""}`}
      </div>

      {users.map((u) => (
        <UserCard
          key={u.id}
          user={u}
          token={token}
          onAction={() => setRefresh((r) => r + 1)}
        />
      ))}
    </div>
  );
}
