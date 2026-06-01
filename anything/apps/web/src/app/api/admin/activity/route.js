import sql from "@/app/api/utils/sql";
import { getAdminFromToken } from "@/app/api/utils/jwtAuth";

export async function GET(request) {
  try {
    const admin = getAdminFromToken(request);
    if (!admin)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");

    // If fetching a specific session's logs
    if (sessionId) {
      const logs = await sql`
        SELECT c.id, c.session_id, c.lines_checked, c.lines_good, c.lines_bad,
               c.credits_used, c.created_at,
               u.telegram_id, u.username, u.first_name
        FROM checker_logs c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.session_id = ${sessionId}
        ORDER BY c.created_at DESC
      `;
      return Response.json({ logs });
    }

    // Aggregated checker stats
    const stats = await sql`
      SELECT
        COUNT(*)::int            AS total_sessions,
        SUM(lines_checked)::int  AS total_cards,
        SUM(lines_good)::int     AS total_approved,
        SUM(lines_bad)::int      AS total_declined
      FROM checker_logs
    `;

    // Recent checker sessions (no generator logs)
    const sessions = await sql`
      SELECT c.id, c.session_id, c.lines_checked, c.lines_good, c.lines_bad,
             c.credits_used, c.created_at,
             u.telegram_id, u.username, u.first_name
      FROM checker_logs c
      LEFT JOIN users u ON u.id = c.user_id
      ORDER BY c.created_at DESC
      LIMIT 50
    `;

    // Redemptions for sidebar context
    const redemptions = await sql`
      SELECT r.id, r.credits_granted, r.redeemed_at,
             rk.key_code, u.username, u.first_name, u.telegram_id
      FROM key_redemptions r
      LEFT JOIN redemption_keys rk ON rk.id = r.key_id
      LEFT JOIN users u ON u.id = r.user_id
      ORDER BY r.redeemed_at DESC
      LIMIT 20
    `;

    return Response.json({
      stats: stats[0] || {
        total_sessions: 0,
        total_cards: 0,
        total_approved: 0,
        total_declined: 0,
      },
      sessions,
      redemptions,
    });
  } catch (error) {
    console.error("Admin activity error:", error);
    return Response.json(
      { error: "Failed to fetch activity" },
      { status: 500 },
    );
  }
}
