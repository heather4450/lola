import sql from "@/app/api/utils/sql";
import { getAdminFromToken } from "@/app/api/utils/jwtAuth";

export async function GET(request) {
  const admin = getAdminFromToken(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const rows = await sql(
      `SELECT s.*, u.username, u.first_name
       FROM sessions s
       LEFT JOIN users u ON u.id = s.user_id
       ORDER BY s.login_time DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    const totalRow = await sql`SELECT COUNT(*)::int AS total FROM sessions`;
    return Response.json({ sessions: rows, total: totalRow[0]?.total || 0 });
  } catch (err) {
    console.error("[admin/sessions] error:", err);
    return Response.json(
      { error: "Failed to fetch sessions" },
      { status: 500 },
    );
  }
}
