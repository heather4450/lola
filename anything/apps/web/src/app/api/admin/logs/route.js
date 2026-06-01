import sql from "@/app/api/utils/sql";
import { getAdminFromToken } from "@/app/api/utils/jwtAuth";

export async function GET(request) {
  const admin = getAdminFromToken(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    let rows;
    if (action) {
      rows = await sql(
        `SELECT l.*, u.username, u.first_name
         FROM logs l
         LEFT JOIN users u ON u.id = l.user_id
         WHERE l.action = $1
         ORDER BY l.created_at DESC
         LIMIT $2 OFFSET $3`,
        [action, limit, offset],
      );
    } else {
      rows = await sql(
        `SELECT l.*, u.username, u.first_name
         FROM logs l
         LEFT JOIN users u ON u.id = l.user_id
         ORDER BY l.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
    }

    const totalRow = await sql`SELECT COUNT(*)::int AS total FROM logs`;
    return Response.json({ logs: rows, total: totalRow[0]?.total || 0 });
  } catch (err) {
    console.error("[admin/logs] error:", err);
    return Response.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
