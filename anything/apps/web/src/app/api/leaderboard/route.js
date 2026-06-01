import sql from "@/app/api/utils/sql";
import { getUserFromToken } from "@/app/api/utils/jwtAuth";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    let leaders;
    if (period === "week" || period === "month") {
      const interval = period === "week" ? "7 days" : "30 days";
      leaders = await sql(
        `SELECT u.id, u.telegram_id, u.username, u.first_name, u.last_name,
                u.photo_url, u.is_premium,
                COALESCE(SUM(c.lines_good), 0) AS hits,
                COALESCE(SUM(c.lines_checked), 0) AS checked
         FROM users u
         LEFT JOIN checker_logs c
           ON c.user_id = u.id AND c.created_at > NOW() - INTERVAL '${interval}'
         WHERE u.is_banned = false
         GROUP BY u.id
         HAVING COALESCE(SUM(c.lines_good), 0) > 0
         ORDER BY hits DESC LIMIT $1`,
        [limit],
      );
    } else {
      leaders = await sql`
        SELECT u.id, u.telegram_id, u.username, u.first_name, u.last_name,
               u.photo_url, u.is_premium, u.total_hits AS hits,
               COALESCE((SELECT SUM(lines_checked) FROM checker_logs WHERE user_id = u.id), 0) AS checked
        FROM users u
        WHERE u.is_banned = false AND u.total_hits > 0
        ORDER BY u.total_hits DESC
        LIMIT ${limit}
      `;
    }

    const ranked = leaders.map((u, idx) => {
      const checked = parseInt(u.checked || 0);
      const hits = parseInt(u.hits || 0);
      const hitRate = checked > 0 ? ((hits / checked) * 100).toFixed(1) : "0.0";
      return {
        rank: idx + 1,
        id: u.id,
        telegram_id: u.telegram_id,
        username: u.username,
        first_name: u.first_name,
        last_name: u.last_name,
        photo_url: u.photo_url,
        is_premium: u.is_premium,
        hits,
        checked,
        hitRate,
      };
    });

    const user = getUserFromToken(request);
    let myRank = null;
    if (user) {
      const mine = ranked.find((r) => r.id === user.userId);
      if (mine) {
        myRank = mine;
      } else {
        const me =
          await sql`SELECT total_hits FROM users WHERE id = ${user.userId}`;
        if (me[0]) {
          const above = await sql`
            SELECT COUNT(*) AS c FROM users
            WHERE is_banned = false AND total_hits > ${me[0].total_hits}
          `;
          myRank = { rank: parseInt(above[0].c) + 1, hits: me[0].total_hits };
        }
      }
    }

    return Response.json({ leaderboard: ranked, myRank, period });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return Response.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}
