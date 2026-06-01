import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, X, Megaphone, CheckCheck, Clock } from "lucide-react";
import { useTheme } from "./ThemeContext";

export default function NotificationBell({ token }) {
  const { theme: t } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissing, setDismissing] = useState({});
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setNotifications(d.notifications || []);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 60000);
    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications]);

  const dismiss = async (id) => {
    setDismissing((p) => ({ ...p, [id]: true }));
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ broadcast_id: id }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {}
    setDismissing((p) => ({ ...p, [id]: false }));
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mark_all: true }),
      });
      setNotifications([]);
      setOpen(false);
    } catch {}
    setLoading(false);
  };

  const count = notifications.length;

  return (
    <>
      {/* Bell button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "relative",
          background: count > 0 ? `${t.neonBlue}14` : t.surface,
          border: `1px solid ${count > 0 ? t.neonBlue + "35" : t.border}`,
          borderRadius: 12,
          width: 38,
          height: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          transition: "all 0.2s",
        }}
      >
        <Bell
          size={17}
          color={count > 0 ? t.neonBlue : t.textMuted}
          strokeWidth={count > 0 ? 2.2 : 1.7}
        />
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              background: t.neonRed,
              color: "#fff",
              fontSize: 9,
              fontWeight: 800,
              borderRadius: "50%",
              minWidth: 16,
              height: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
              boxShadow: `0 0 8px ${t.neonRed}80`,
              letterSpacing: 0,
            }}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 900,
            animation: "fadeBackdrop 0.2s ease",
          }}
        />
      )}

      {/* Slide-up drawer */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: "80vh",
            background: t.bg,
            borderTop: `1px solid ${t.border}`,
            borderRadius: "24px 24px 0 0",
            zIndex: 901,
            display: "flex",
            flexDirection: "column",
            animation: "slideUp 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* Handle */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: t.border,
              }}
            />
          </div>

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px 10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={15} color={t.neonBlue} />
              <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>
                Notifications
              </span>
              {count > 0 && (
                <span
                  style={{
                    background: `${t.neonBlue}20`,
                    border: `1px solid ${t.neonBlue}40`,
                    borderRadius: 20,
                    padding: "1px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: t.neonBlue,
                  }}
                >
                  {count}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {count > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  style={{
                    background: `${t.neonGreen}12`,
                    border: `1px solid ${t.neonGreen}30`,
                    borderRadius: 8,
                    padding: "5px 10px",
                    color: t.neonGreen,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  <CheckCheck size={11} />
                  All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: t.textMuted,
                }}
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: t.border, marginBottom: 4 }} />

          {/* Content */}
          <div style={{ overflowY: "auto", flex: 1, padding: "8px 14px 28px" }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: t.surface,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bell size={20} color={t.textSub} />
                </div>
                <div style={{ fontSize: 13, color: t.textMuted }}>
                  You're all caught up!
                </div>
                <div style={{ fontSize: 11, color: t.textSub }}>
                  No new announcements
                </div>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    background: t.surface,
                    border: `1px solid ${t.border}`,
                    borderRadius: 14,
                    padding: "12px 14px",
                    marginBottom: 8,
                    opacity: dismissing[n.id] ? 0.5 : 1,
                    transition: "opacity 0.2s",
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
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: `${t.neonBlue}18`,
                          border: `1px solid ${t.neonBlue}30`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Megaphone size={12} color={t.neonBlue} />
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: t.text,
                          lineHeight: 1.3,
                        }}
                      >
                        {n.title}
                      </span>
                    </div>
                    <button
                      onClick={() => dismiss(n.id)}
                      disabled={dismissing[n.id]}
                      style={{
                        background: "none",
                        border: "none",
                        color: t.textSub,
                        cursor: "pointer",
                        padding: 2,
                        flexShrink: 0,
                        display: "flex",
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: t.textMuted,
                      lineHeight: 1.6,
                      marginBottom: 8,
                      wordBreak: "break-word",
                    }}
                  >
                    {n.body}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      color: t.textSub,
                    }}
                  >
                    <Clock size={9} />
                    {new Date(n.created_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeBackdrop { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
      `}</style>
    </>
  );
}
