import { Crown, Clock, Sparkles } from "lucide-react";
import { useTheme } from "@/components/ThemeContext";
import { getC } from "@/utils/checkerStyles";

export function UserHeader({ user, credits, isAdmin }) {
  const { theme } = useTheme();
  const C = getC(theme);

  const createdAt = user?.created_at;
  let accountAge = "";
  if (createdAt) {
    const days = Math.floor((Date.now() - new Date(createdAt)) / 86400000);
    accountAge =
      days < 30
        ? `${days}d`
        : days < 365
          ? `${Math.floor(days / 30)}mo`
          : `${Math.floor(days / 365)}y`;
  }

  const displayName = user
    ? user.first_name
      ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}`
      : user.username || "User"
    : "User";
  const creditValue = credits ?? user?.credits ?? "—";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        marginBottom: 16,
        paddingTop: 4,
      }}
    >
      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.blue}, #7c3aed)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            fontWeight: 700,
            color: "#fff",
            overflow: "hidden",
            boxShadow: `0 0 0 2px ${C.blue}22, 0 0 18px ${C.blue}18`,
            border: `2px solid ${C.blue}35`,
          }}
        >
          {user?.photo_url ? (
            <img
              src={user.photo_url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            (displayName[0] || "U").toUpperCase()
          )}
        </div>
        {(isAdmin || user?.is_premium) && (
          <div
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 15,
              height: 15,
              borderRadius: "50%",
              background: isAdmin
                ? "linear-gradient(135deg, #FFD60A, #FF9F0A)"
                : "linear-gradient(135deg, #f59e0b, #f97316)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1.5px solid ${C.bg}`,
            }}
          >
            <Crown size={7} color="#fff" />
          </div>
        )}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.text,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayName}
          </span>
          {isAdmin && (
            <span
              style={{
                background: "rgba(255,159,10,0.13)",
                border: "1px solid rgba(255,159,10,0.3)",
                borderRadius: 5,
                padding: "1px 6px",
                fontSize: 9,
                fontWeight: 700,
                color: "#FF9F0A",
                flexShrink: 0,
              }}
            >
              ADMIN
            </span>
          )}
          {!isAdmin && user?.is_premium && (
            <span
              style={{
                background: "rgba(249,115,22,0.12)",
                border: "1px solid rgba(249,115,22,0.3)",
                borderRadius: 5,
                padding: "1px 6px",
                fontSize: 9,
                fontWeight: 700,
                color: "#f97316",
                flexShrink: 0,
              }}
            >
              PRO
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: C.muted,
            marginTop: 1,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {user?.username && <span>@{user.username}</span>}
          {accountAge && (
            <>
              <span style={{ color: C.border }}>·</span>
              <Clock size={9} color={C.muted} />
              <span>{accountAge}</span>
            </>
          )}
        </div>
      </div>

      {/* Gold credits pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          background:
            "linear-gradient(135deg, rgba(255,214,10,0.13), rgba(255,159,10,0.08))",
          border: "1px solid rgba(255,214,10,0.30)",
          borderRadius: 20,
          padding: "7px 12px",
          boxShadow:
            "0 0 14px rgba(255,180,0,0.15), 0 0 28px rgba(255,159,10,0.07)",
          flexShrink: 0,
        }}
      >
        <Sparkles size={11} color="#FFD60A" />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            background: "linear-gradient(135deg, #FFD60A, #FF9F0A)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {creditValue}
        </span>
      </div>
    </div>
  );
}
