import { useState, useEffect, useCallback } from "react";
import {
  Send,
  Users,
  Radio,
  Clock,
  CheckCircle,
  Search,
  X,
  Megaphone,
} from "lucide-react";

const C = {
  bg: "rgba(255,255,255,0.03)",
  bgStrong: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)",
  text: "#fff",
  muted: "rgba(255,255,255,0.5)",
  sub: "rgba(255,255,255,0.3)",
  blue: "#4DA3FF",
  green: "#30D158",
  red: "#FF453A",
  yellow: "#FF9F0A",
  purple: "#BF5AF2",
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

function BroadcastHistory({ broadcasts }) {
  if (!broadcasts.length) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "28px 0",
          color: C.muted,
          fontSize: 13,
        }}
      >
        No broadcasts sent yet
      </div>
    );
  }
  return (
    <div>
      {broadcasts.map((b) => (
        <div
          key={b.id}
          style={{
            ...glassCard({ borderRadius: 14 }),
            padding: "12px 14px",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Megaphone size={12} color={C.blue} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                {b.title}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  padding: "1px 7px",
                  borderRadius: 6,
                  fontSize: 9,
                  fontWeight: 700,
                  background:
                    b.target_type === "all" ? `${C.blue}18` : `${C.purple}18`,
                  border: `1px solid ${b.target_type === "all" ? C.blue + "35" : C.purple + "35"}`,
                  color: b.target_type === "all" ? C.blue : C.purple,
                }}
              >
                {b.target_type === "all" ? "ALL USERS" : "SPECIFIC"}
              </span>
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.muted,
              lineHeight: 1.5,
              marginBottom: 8,
              wordBreak: "break-word",
            }}
          >
            {b.body}
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              fontSize: 10,
              color: C.sub,
              alignItems: "center",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Users size={9} /> {b.delivery_count} recipients
            </span>
            {/* In-App is always delivered */}
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                color: C.green,
              }}
            >
              <CheckCircle size={9} /> In-App
            </span>
            {b.telegram_attempted && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  color: C.yellow,
                }}
              >
                <CheckCircle size={9} /> Telegram
              </span>
            )}
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                marginLeft: "auto",
              }}
            >
              <Clock size={9} />
              {new Date(b.created_at).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminBroadcast({ token }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetAll, setTargetAll] = useState(true);
  const [sendTelegram, setSendTelegram] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [view, setView] = useState("compose"); // "compose" | "history"

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      setHistory(d.broadcasts || []);
    } catch {}
    setHistoryLoading(false);
  }, [token]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!userSearch.trim() || targetAll) {
      setUsers([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ search: userSearch, limit: "20" });
        const res = await fetch(`/api/admin/users?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await res.json();
        setUsers(d.users || []);
      } catch {}
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearch, targetAll, token]);

  const toggleUser = (u) => {
    setSelectedUsers((prev) =>
      prev.find((x) => x.id === u.id)
        ? prev.filter((x) => x.id !== u.id)
        : [...prev, u],
    );
  };

  const removeUser = (id) =>
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Title and message body are required");
      return;
    }
    if (!targetAll && selectedUsers.length === 0) {
      setError("Select at least one user or switch to Send to All");
      return;
    }
    setSending(true);
    setError(null);
    setSent(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          target_type: targetAll ? "all" : "specific",
          target_user_ids: targetAll ? [] : selectedUsers.map((u) => u.id),
          send_telegram: sendTelegram,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setSent(d);
      setTitle("");
      setBody("");
      setSelectedUsers([]);
      setUserSearch("");
      loadHistory();
    } catch (err) {
      setError(err.message);
    }
    setSending(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 12px",
    background: "rgba(0,0,0,0.35)",
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.text,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    resize: "none",
    fontFamily: "inherit",
  };

  const Toggle = ({ label, value, onChange, color }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: value ? color : C.muted,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: value ? color : "rgba(255,255,255,0.1)",
          position: "relative",
          cursor: "pointer",
          boxShadow: value ? `0 0 8px ${color}50` : "none",
          flexShrink: 0,
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: value ? 21 : 3,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
          }}
        />
      </div>
    </div>
  );

  return (
    <div>
      {/* Tab switch */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["compose", "history"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              border:
                view === v ? `1px solid ${C.blue}50` : `1px solid ${C.border}`,
              background: view === v ? `${C.blue}14` : "rgba(255,255,255,0.04)",
              color: view === v ? C.blue : C.muted,
              fontSize: 12,
              fontWeight: view === v ? 600 : 400,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {v === "compose" ? (
              <>
                <Radio size={11} /> Compose
              </>
            ) : (
              <>
                <Clock size={11} /> History ({history.length})
              </>
            )}
          </button>
        ))}
      </div>

      {view === "history" &&
        (historyLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
            Loading…
          </div>
        ) : (
          <BroadcastHistory broadcasts={history} />
        ))}

      {view === "compose" && (
        <div>
          {/* Success banner */}
          {sent && (
            <div
              style={{
                ...glassCard({ borderRadius: 12 }),
                padding: "12px 14px",
                marginBottom: 12,
                background: `${C.green}12`,
                border: `1px solid ${C.green}30`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle size={14} color={C.green} />
                <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>
                  Sent to {sent.recipientCount} users — In-App
                  {sent.broadcast?.telegram_attempted ? " + Telegram" : ""}
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                ...glassCard({ borderRadius: 12 }),
                padding: "10px 14px",
                marginBottom: 12,
                background: `${C.red}10`,
                border: `1px solid ${C.red}30`,
                fontSize: 12,
                color: C.red,
              }}
            >
              ⚠ {error}
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}
            >
              MESSAGE TITLE
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title..."
              style={inputStyle}
            />
          </div>

          {/* Body */}
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}
            >
              MESSAGE BODY
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your announcement here..."
              rows={4}
              style={inputStyle}
            />
            <div
              style={{
                fontSize: 10,
                color: C.sub,
                marginTop: 4,
                textAlign: "right",
              }}
            >
              {body.length} chars
            </div>
          </div>

          {/* Options */}
          <div
            style={{
              ...glassCard({ borderRadius: 14 }),
              padding: "12px 14px",
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* In-App — always on */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 12, fontWeight: 600, color: C.green }}
                  >
                    📱 In-App Delivery
                  </div>
                  <div style={{ fontSize: 10, color: C.sub, marginTop: 1 }}>
                    Always on — users see it in the notification bell
                  </div>
                </div>
                <div
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: `${C.green}18`,
                    border: `1px solid ${C.green}35`,
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.green,
                    letterSpacing: "0.06em",
                    flexShrink: 0,
                  }}
                >
                  ALWAYS ON
                </div>
              </div>

              <div style={{ height: 1, background: C.border }} />

              <Toggle
                label="Send to All Users"
                value={targetAll}
                onChange={setTargetAll}
                color={C.blue}
              />

              <div style={{ height: 1, background: C.border }} />

              {/* Telegram — optional */}
              <Toggle
                label="Also Send via Telegram Bot"
                value={sendTelegram}
                onChange={setSendTelegram}
                color={C.yellow}
              />
              {sendTelegram && (
                <div style={{ fontSize: 10, color: C.sub, marginTop: -4 }}>
                  Requires TELEGRAM_BOT_TOKEN to be set in env variables
                </div>
              )}
            </div>
          </div>

          {/* Specific user selector */}
          {!targetAll && (
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}
              >
                SELECT RECIPIENTS
              </div>

              {/* Selected users chips */}
              {selectedUsers.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  {selectedUsers.map((u) => {
                    const name = u.first_name || u.username || `ID ${u.id}`;
                    return (
                      <div
                        key={u.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 10px",
                          borderRadius: 20,
                          background: `${C.blue}14`,
                          border: `1px solid ${C.blue}35`,
                          fontSize: 11,
                          color: C.blue,
                        }}
                      >
                        {name}
                        <button
                          onClick={() => removeUser(u.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: C.blue,
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                          }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Search */}
              <div style={{ position: "relative" }}>
                <Search
                  size={12}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: C.muted,
                  }}
                />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users by name, username or ID..."
                  style={{ ...inputStyle, paddingLeft: 32 }}
                />
              </div>

              {searching && (
                <div style={{ fontSize: 11, color: C.muted, padding: "8px 0" }}>
                  Searching…
                </div>
              )}

              {users.length > 0 && (
                <div
                  style={{
                    ...glassCard({ borderRadius: 12 }),
                    marginTop: 6,
                    overflow: "hidden",
                    maxHeight: 200,
                    overflowY: "auto",
                  }}
                >
                  {users.map((u) => {
                    const name = u.first_name
                      ? `${u.first_name}${u.last_name ? " " + u.last_name : ""}`
                      : u.username || `ID ${u.id}`;
                    const sel = !!selectedUsers.find((x) => x.id === u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleUser(u)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 12px",
                          cursor: "pointer",
                          borderBottom: `1px solid ${C.border}`,
                          background: sel ? `${C.blue}10` : "transparent",
                          transition: "background 0.15s",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: sel
                              ? `${C.blue}30`
                              : "rgba(255,255,255,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            color: sel ? C.blue : C.muted,
                            flexShrink: 0,
                          }}
                        >
                          {name[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 12,
                              color: sel ? C.blue : C.text,
                              fontWeight: sel ? 600 : 400,
                            }}
                          >
                            {name}
                          </div>
                          <div style={{ fontSize: 10, color: C.muted }}>
                            {u.username ? `@${u.username} · ` : ""}
                            {u.credits} cr
                          </div>
                        </div>
                        {sel && <CheckCircle size={13} color={C.blue} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 12,
              border: "none",
              background:
                sending || !title.trim() || !body.trim()
                  ? "rgba(77,163,255,0.2)"
                  : "linear-gradient(135deg, #0055ee, #4DA3FF)",
              color:
                sending || !title.trim() || !body.trim()
                  ? "rgba(77,163,255,0.5)"
                  : "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor:
                sending || !title.trim() || !body.trim()
                  ? "not-allowed"
                  : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              letterSpacing: "0.03em",
            }}
          >
            <Send size={14} />
            {sending
              ? "SENDING..."
              : targetAll
                ? "BROADCAST TO ALL USERS"
                : `SEND TO ${selectedUsers.length} USER${selectedUsers.length !== 1 ? "S" : ""}`}
          </button>

          {!targetAll && selectedUsers.length === 0 && (
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                textAlign: "center",
                marginTop: 6,
              }}
            >
              Search and select users above, or enable "Send to All"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
