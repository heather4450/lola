import sql from "@/app/api/utils/sql";
import { getUserFromToken } from "@/app/api/utils/jwtAuth";

export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const result = await sql`
      SELECT id, telegram_id, username, first_name, last_name, photo_url,
             credits, is_premium, premium_until, created_at, last_active
      FROM users WHERE id = ${user.userId}
    `;
    if (!result[0])
      return Response.json({ error: "User not found" }, { status: 404 });

    const genStats = await sql`
      SELECT COUNT(*) as sessions, COALESCE(SUM(amount), 0) as total_generated
      FROM generated_logs WHERE user_id = ${user.userId}
    `;
    const checkStats = await sql`
      SELECT COUNT(*) as sessions, COALESCE(SUM(lines_checked), 0) as total_checked,
             COALESCE(SUM(lines_good), 0) as total_good
      FROM checker_logs WHERE user_id = ${user.userId}
    `;

    return Response.json({
      user: result[0],
      stats: {
        totalGenerated: parseInt(genStats[0]?.total_generated || 0),
        totalChecked: parseInt(checkStats[0]?.total_checked || 0),
        totalGood: parseInt(checkStats[0]?.total_good || 0),
        generatorSessions: parseInt(genStats[0]?.sessions || 0),
        checkerSessions: parseInt(checkStats[0]?.sessions || 0),
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    return Response.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
