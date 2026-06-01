import { useState, useEffect } from "react";
import { Plus, Save, X, CreditCard, Info } from "lucide-react";

const C = {
  bg: "rgba(255,255,255,0.03)",
  bgStrong: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)",
  text: "#fff",
  muted: "rgba(255,255,255,0.45)",
  sub: "rgba(255,255,255,0.28)",
  blue: "#00b4ff",
  green: "#00ff88",
  red: "#ff3b5c",
  yellow: "#ffb800",
};

function GatewayRow({ gw, token, onSaved }) {
  const [approved, setApproved] = useState(String(gw.cost_approved));
  const [declined, setDeclined] = useState(String(gw.cost_declined));
  const [active, setActive] = useState(gw.is_active);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => setDirty(true);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/gateways", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: gw.id,
          cost_approved: parseInt(approved) || 0,
          cost_declined: parseInt(declined) || 0,
          is_active: active,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setDirty(false);
        setTimeout(() => setSaved(false), 2000);
        onSaved && onSaved();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${active ? C.border : "rgba(255,59,92,0.2)"}`,
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 8,
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CreditCard size={13} color={active ? C.blue : C.muted} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: active ? C.text : C.muted,
            }}
          >
            {gw.name}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {dirty && (
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: "4px 10px",
                borderRadius: 7,
                background: saved ? `${C.green}20` : `${C.blue}20`,
                border: `1px solid ${saved ? C.green + "50" : C.blue + "50"}`,
                color: saved ? C.green : C.blue,
                fontSize: 11,
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Save size={10} /> {saving ? "..." : saved ? "SAVED ✓" : "SAVE"}
            </button>
          )}
          {/* Active toggle */}
          <div
            onClick={() => {
              setActive((a) => !a);
              markDirty();
            }}
            style={{
              width: 40,
              height: 22,
              borderRadius: 11,
              background: active ? C.green : "rgba(255,255,255,0.1)",
              position: "relative",
              cursor: "pointer",
              boxShadow: active ? `0 0 8px ${C.green}50` : "none",
              transition: "background 0.2s",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                left: active ? 21 : 3,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
              }}
            />
          </div>
        </div>
      </div>

      {/* Cost inputs */}
      <div style={{ display: "flex", gap: 10 }}>
        <CostField
          label="APPROVED"
          value={approved}
          color={C.green}
          onChange={(v) => {
            setApproved(v);
            markDirty();
          }}
        />
        <CostField
          label="DECLINED"
          value={declined}
          color={C.red}
          onChange={(v) => {
            setDeclined(v);
            markDirty();
          }}
        />
      </div>
      <div
        style={{
          fontSize: 10,
          color: C.sub,
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Info size={9} />
        Credits deducted per card result for this gateway
      </div>
    </div>
  );
}

function CostField({ label, value, color, onChange }) {
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.08em",
          marginBottom: 5,
        }}
      >
        {label} (cr)
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <button
          onClick={() =>
            onChange(String(Math.max(0, parseInt(value || 0) - 1)))
          }
          style={{
            width: 32,
            height: 36,
            background: "rgba(255,255,255,0.05)",
            border: `1px solid rgba(255,255,255,0.08)`,
            borderRight: "none",
            borderRadius: "8px 0 0 8px",
            color: C.muted,
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          −
        </button>
        <input
          type="tel"
          value={value}
          onChange={(e) =>
            onChange(e.target.value.replace(/\D/g, "").slice(0, 4))
          }
          style={{
            flex: 1,
            height: 36,
            textAlign: "center",
            background: `${color}0f`,
            border: `1px solid ${color}30`,
            color,
            fontSize: 15,
            fontWeight: 700,
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "monospace",
          }}
        />
        <button
          onClick={() =>
            onChange(String(Math.min(9999, parseInt(value || 0) + 1)))
          }
          style={{
            width: 32,
            height: 36,
            background: "rgba(255,255,255,0.05)",
            border: `1px solid rgba(255,255,255,0.08)`,
            borderLeft: "none",
            borderRadius: "0 8px 8px 0",
            color: C.muted,
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function AdminGateways({ token }) {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newApproved, setNewApproved] = useState("1");
  const [newDeclined, setNewDeclined] = useState("1");
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/gateways", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setGateways(d.gateways || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token]);

  const addGateway = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/gateways", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          cost_approved: parseInt(newApproved) || 1,
          cost_declined: parseInt(newDeclined) || 1,
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewApproved("1");
        setNewDeclined("1");
        setShowAdd(false);
        load();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      {/* Info banner */}
      <div
        style={{
          background: `${C.blue}0d`,
          border: `1px solid ${C.blue}25`,
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 14,
          fontSize: 12,
          color: C.muted,
          lineHeight: 1.6,
        }}
      >
        <span style={{ color: C.blue, fontWeight: 600 }}>
          Default: 1 credit per check
        </span>{" "}
        regardless of result. Set different costs per gateway —{" "}
        <span style={{ color: C.green }}>Approved</span> and{" "}
        <span style={{ color: C.red }}>Declined</span> are billed separately.
      </div>

      {/* Add new */}
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => setShowAdd((s) => !s)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 10,
            background: showAdd ? "rgba(255,59,92,0.1)" : `${C.blue}15`,
            border: showAdd
              ? `1px solid rgba(255,59,92,0.3)`
              : `1px solid ${C.blue}35`,
            color: showAdd ? C.red : C.blue,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {showAdd ? (
            <>
              <X size={12} /> CANCEL
            </>
          ) : (
            <>
              <Plus size={12} /> ADD GATEWAY
            </>
          )}
        </button>

        {showAdd && (
          <div
            style={{
              marginTop: 10,
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  marginBottom: 5,
                  letterSpacing: "0.08em",
                }}
              >
                GATEWAY NAME
              </div>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Shopify 10-50$"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "rgba(0,0,0,0.4)",
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.text,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <CostField
                label="APPROVED (cr)"
                value={newApproved}
                color={C.green}
                onChange={setNewApproved}
              />
              <CostField
                label="DECLINED (cr)"
                value={newDeclined}
                color={C.red}
                onChange={setNewDeclined}
              />
            </div>
            <button
              onClick={addGateway}
              disabled={adding || !newName.trim()}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 10,
                border: "none",
                background:
                  adding || !newName.trim()
                    ? "rgba(0,180,255,0.2)"
                    : "linear-gradient(135deg, #0066ff, #00b4ff)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: adding || !newName.trim() ? "not-allowed" : "pointer",
              }}
            >
              {adding ? "ADDING..." : "ADD GATEWAY"}
            </button>
          </div>
        )}
      </div>

      {/* Gateway list */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: C.muted,
            fontSize: 13,
          }}
        >
          Loading...
        </div>
      ) : (
        gateways.map((gw) => (
          <GatewayRow key={gw.id} gw={gw} token={token} onSaved={load} />
        ))
      )}
    </div>
  );
}
