import sql from "@/app/api/utils/sql";
import { getAdminFromToken } from "@/app/api/utils/jwtAuth";

export async function GET(request) {
  try {
    const admin = getAdminFromToken(request);
    if (!admin)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const gateways = await sql`SELECT * FROM gateway_configs ORDER BY id ASC`;
    return Response.json({ gateways });
  } catch (error) {
    console.error("Gateways GET error:", error);
    return Response.json(
      { error: "Failed to fetch gateways" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const admin = getAdminFromToken(request);
    if (!admin)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, name, cost_approved, cost_declined, is_active } = body;

    if (id) {
      // Build dynamic update
      const sets = [];
      const vals = [];
      let i = 1;
      if (cost_approved !== undefined) {
        sets.push(`cost_approved = $${i++}`);
        vals.push(Math.max(0, parseInt(cost_approved) || 0));
      }
      if (cost_declined !== undefined) {
        sets.push(`cost_declined = $${i++}`);
        vals.push(Math.max(0, parseInt(cost_declined) || 0));
      }
      if (is_active !== undefined) {
        sets.push(`is_active = $${i++}`);
        vals.push(Boolean(is_active));
      }
      sets.push("updated_at = NOW()");
      vals.push(id);
      const result = await sql(
        `UPDATE gateway_configs SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
        vals,
      );
      return Response.json({ success: true, gateway: result[0] });
    }

    // Insert new gateway
    if (!name)
      return Response.json({ error: "Name required" }, { status: 400 });
    const result = await sql`
      INSERT INTO gateway_configs (name, cost_approved, cost_declined)
      VALUES (${name.trim()}, ${Math.max(0, parseInt(cost_approved) || 1)}, ${Math.max(0, parseInt(cost_declined) || 1)})
      ON CONFLICT (name) DO UPDATE SET
        cost_approved = EXCLUDED.cost_approved,
        cost_declined = EXCLUDED.cost_declined,
        updated_at = NOW()
      RETURNING *
    `;
    return Response.json({ success: true, gateway: result[0] });
  } catch (error) {
    console.error("Gateways POST error:", error);
    return Response.json({ error: "Failed to save gateway" }, { status: 500 });
  }
}
