import { useState, useEffect } from "react";
import { Plus, Copy, Check, X, Clock } from "lucide-react";

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

function KeyCard({ keyItem, token, onUpdate }) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isActive =
    keyItem.is_active &&
    keyItem.current_uses < keyItem.max_uses &&
    (!keyItem.expires_at || new Date(keyItem.expires_at) > new Date());
  const usesLeft = keyItem.max_uses - keyItem.current_uses;

  const copy = () => {
    navigator.clipboard.writeText(keyItem.key_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggle = async () => {
    await fetch("/api/keys/deactivate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ keyId: keyItem.id, activate: !keyItem.is_active }),
    });
    onUpdate && onUpdate();
  };

  const deleteKey = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/keys/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keyId: keyItem.id }),
      });
      if (res.ok) onUpdate && onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${isActive ? C.neonGreen + "30" : C.border}`,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 13,
            fontWeight: 700,
            color: isActive ? C.neonGreen : C.muted,
            letterSpacing: "0.05em",
          }}
        >
          {keyItem.key_code}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={copy}
            style={{
              background: C.bgStrong,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "4px 8px",
              color: copied ? C.neonGreen : C.muted,
              fontSize: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? "COPIED" : "COPY"}
          </button>
          <button
            onClick={toggle}
            style={{
              background: keyItem.is_active
                ? C.neonRed + "15"
                : C.neonGreen + "15",
              border: `1px solid ${keyItem.is_active ? C.neonRed + "40" : C.neonGreen + "40"}`,
              borderRadius: 6,
              padding: "4px 8px",
              color: keyItem.is_active ? C.neonRed : C.neonGreen,
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            {keyItem.is_active ? "DISABLE" : "ENABLE"}
          </button>
          {/* Delete */}
          {confirmDelete ? (
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={deleteKey}
                disabled={deleting}
                style={{
                  background: C.neonRed + "20",
                  border: `1px solid ${C.neonRed}50`,
                  borderRadius: 6,
                  padding: "4px 8px",
                  color: C.neonRed,
                  fontSize: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {deleting ? "…" : "CONFIRM"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  background: C.bgStrong,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "4px 6px",
                  color: C.muted,
                  fontSize: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={10} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                background: "rgba(255,59,92,0.08)",
                border: `1px solid rgba(255,59,92,0.2)`,
                borderRadius: 6,
                padding: "4px 6px",
                color: C.neonRed,
                fontSize: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          fontSize: 11,
          color: C.muted,
        }}
      >
        <span>
          💎 <b style={{ color: C.neonBlue }}>{keyItem.credit_value}</b> credits
        </span>
        <span>
          📊 {keyItem.current_uses}/{keyItem.max_uses} used
        </span>
        {usesLeft > 0 && keyItem.is_active && (
          <span style={{ color: C.neonGreen }}>✓ {usesLeft} left</span>
        )}
        {keyItem.expires_at && (
          <span
            style={{
              color:
                new Date(keyItem.expires_at) < new Date() ? C.neonRed : C.muted,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Clock size={9} />{" "}
            {new Date(keyItem.expires_at).toLocaleDateString()}
          </span>
        )}
      </div>
      {keyItem.note && (
        <div style={{ fontSize: 10, color: C.sub, marginTop: 4 }}>
          📝 {keyItem.note}
        </div>
      )}
    </div>
  );
}

export default function AdminKeys({ token }) {
  const [keys, setKeys] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    credit_value: 100,
    max_uses: 1,
    expires_in_days: 0,
    count: 1,
    note: "",
  });
  const [createdKeys, setCreatedKeys] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/keys/list?status=${filter}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setKeys(d.keys || []);
        setRedemptions(d.recentRedemptions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, filter, refresh]);

  const createKeys = async () => {
    const res = await fetch("/api/keys/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok && data.keys) {
      setCreatedKeys(data.keys);
      setRefresh((r) => r + 1);
    }
  };

  const copyAllCreated = () => {
    navigator.clipboard.writeText(
      createdKeys.map((k) => k.key_code).join("\n"),
    );
  };

  return (
    <div>
      {/* Create */}
      <div
        style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: creating ? 12 : 0,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
            Create Redemption Keys
          </span>
          <button
            onClick={() => setCreating(!creating)}
            style={{
              background: creating ? C.neonRed + "20" : C.neonBlue + "20",
              border: `1px solid ${creating ? C.neonRed + "40" : C.neonBlue + "40"}`,
              borderRadius: 8,
              padding: "5px 10px",
              color: creating ? C.neonRed : C.neonBlue,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {creating ? <X size={11} /> : <Plus size={11} />}
            {creating ? "CANCEL" : "NEW"}
          </button>
        </div>

        {creating && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <FormField
                label="Credit Value"
                value={form.credit_value}
                onChange={(v) =>
                  setForm({ ...form, credit_value: parseInt(v) || 0 })
                }
              />
              <FormField
                label="Max Uses"
                value={form.max_uses}
                onChange={(v) =>
                  setForm({ ...form, max_uses: parseInt(v) || 1 })
                }
              />
              <FormField
                label="Expires (days, 0=never)"
                value={form.expires_in_days}
                onChange={(v) =>
                  setForm({ ...form, expires_in_days: parseInt(v) || 0 })
                }
              />
              <FormField
                label="Quantity"
                value={form.count}
                onChange={(v) => setForm({ ...form, count: parseInt(v) || 1 })}
              />
            </div>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Note (optional)"
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(0,0,0,0.4)",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.text,
                fontSize: 12,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 10,
              }}
            />
            <button
              onClick={createKeys}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "none",
                background: `linear-gradient(135deg, #0066ff, ${C.neonBlue})`,
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.04em",
              }}
            >
              GENERATE {form.count} KEY{form.count > 1 ? "S" : ""}
            </button>

            {createdKeys.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  background: C.neonGreen + "10",
                  border: `1px solid ${C.neonGreen}30`,
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: C.neonGreen,
                      fontWeight: 600,
                    }}
                  >
                    ✓ {createdKeys.length} CREATED
                  </span>
                  <button
                    onClick={copyAllCreated}
                    style={{
                      background: C.neonGreen + "20",
                      border: `1px solid ${C.neonGreen}40`,
                      borderRadius: 6,
                      padding: "3px 8px",
                      color: C.neonGreen,
                      fontSize: 10,
                      cursor: "pointer",
                    }}
                  >
                    COPY ALL
                  </button>
                </div>
                <div
                  style={{
                    maxHeight: 100,
                    overflowY: "auto",
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: C.neonGreen,
                    lineHeight: 1.6,
                  }}
                >
                  {createdKeys.map((k) => (
                    <div key={k.id}>{k.key_code}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {[
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "expired", label: "Used/Expired" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              flex: 1,
              padding: "7px 0",
              borderRadius: 8,
              border:
                filter === f.id
                  ? `1px solid ${C.neonBlue}`
                  : `1px solid ${C.border}`,
              background: filter === f.id ? C.neonBlue + "15" : C.bg,
              color: filter === f.id ? C.neonBlue : C.muted,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
        {loading
          ? "Loading..."
          : `${keys.length} key${keys.length !== 1 ? "s" : ""}`}
      </div>

      {keys.map((k) => (
        <KeyCard
          key={k.id}
          keyItem={k}
          token={token}
          onUpdate={() => setRefresh((r) => r + 1)}
        />
      ))}

      {/* Recent Redemptions */}
      {redemptions.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 11,
              color: C.muted,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Recent Redemptions
          </div>
          {redemptions.map((r) => (
            <div
              key={r.id}
              style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "8px 12px",
                marginBottom: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: C.text }}>
                  {r.first_name || r.username || `User ${r.telegram_id}`}
                </div>
                <div
                  style={{ fontSize: 9, color: C.sub, fontFamily: "monospace" }}
                >
                  {r.key_code}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{ fontSize: 12, fontWeight: 700, color: C.neonGreen }}
                >
                  +{r.credits_granted}
                </div>
                <div style={{ fontSize: 9, color: C.sub }}>
                  {new Date(r.redeemed_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormField({ label, value, onChange }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          color: C.muted,
          marginBottom: 4,
          letterSpacing: "0.05em",
        }}
      >
        {label.toUpperCase()}
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "7px 10px",
          background: "rgba(0,0,0,0.4)",
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          color: C.text,
          fontSize: 12,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
