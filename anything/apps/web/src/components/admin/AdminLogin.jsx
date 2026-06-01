import { useState } from "react";
import { Lock, Shield, AlertTriangle } from "lucide-react";

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locked, setLocked] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if (locked) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setLocked(true);
        setError(data.error);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("binchecker_admin_token", data.token);
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setPassword("");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at center, #1a0f2e 0%, #0d0d1a 60%, #050508 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
          border: `1px solid ${locked ? "rgba(255,69,58,0.35)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 20,
          padding: 28,
          boxShadow: locked
            ? "0 0 30px rgba(255,69,58,0.15)"
            : "0 0 30px rgba(0,180,255,0.15)",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            background: locked
              ? "linear-gradient(135deg, #FF453A, #ff6b35)"
              : "linear-gradient(135deg, #0066ff, #b06cff)",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: locked
              ? "0 0 24px rgba(255,69,58,0.4)"
              : "0 0 24px rgba(0,180,255,0.4)",
          }}
        >
          {locked ? (
            <AlertTriangle size={28} color="#fff" />
          ) : (
            <Shield size={28} color="#fff" />
          )}
        </div>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 4,
            }}
          >
            {locked ? "Access Locked" : "Admin Dashboard"}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            {locked
              ? "Too many failed attempts"
              : "Enter admin password to continue"}
          </div>
        </div>

        {!locked && (
          <div style={{ position: "relative", marginBottom: 14 }}>
            <Lock
              size={14}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.4)",
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              style={{
                width: "100%",
                padding: "12px 14px 12px 40px",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#fff",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {error && (
          <div
            style={{
              background: "rgba(255,59,92,0.1)",
              border: "1px solid rgba(255,59,92,0.3)",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 12,
              color: "#ff3b5c",
              marginBottom: 14,
              lineHeight: 1.5,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {!locked && (
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%",
              padding: 13,
              borderRadius: 12,
              border: "none",
              background: loading
                ? "rgba(0,180,255,0.3)"
                : "linear-gradient(135deg, #0066ff, #00b4ff)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading || !password ? "not-allowed" : "pointer",
              letterSpacing: "0.04em",
              boxShadow: "0 4px 18px rgba(0,180,255,0.3)",
            }}
          >
            {loading ? "AUTHENTICATING..." : "ENTER DASHBOARD"}
          </button>
        )}

        {locked && (
          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              marginTop: 8,
            }}
          >
            Please wait and try again later
          </div>
        )}
      </form>
    </div>
  );
}
