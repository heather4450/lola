import sql from "@/app/api/utils/sql";
import { getAdminFromToken } from "@/app/api/utils/jwtAuth";

export async function GET(request) {
  try {
    const admin = getAdminFromToken(request);
    if (!admin)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const [userStats] = await sql`
      SELECT
        COUNT(*) AS total_users,
        COUNT(*) FILTER (WHERE is_premium = true) AS premium_users,
        COUNT(*) FILTER (WHERE is_banned = true) AS banned_users,
        COALESCE(SUM(credits), 0) AS total_credits,
        COALESCE(SUM(total_hits), 0) AS total_hits
      FROM users
    `;

    const [genStats] = await sql`
      SELECT
        COUNT(*) AS sessions,
        COALESCE(SUM(amount), 0) AS total_generated,
        COALESCE(SUM(credits_used), 0) AS credits_spent_gen
      FROM generated_logs
    `;

    const [checkStats] = await sql`
      SELECT
        COUNT(*) AS sessions,
        COALESCE(SUM(lines_checked), 0) AS total_checked,
        COALESCE(SUM(lines_good), 0) AS total_good,
        COALESCE(SUM(lines_bad), 0) AS total_bad
      FROM checker_logs
    `;

    const [keyStats] = await sql`
      SELECT
        COUNT(*) AS total_keys,
        COUNT(*) FILTER (WHERE is_active = true) AS active_keys,
        COALESCE(SUM(current_uses), 0) AS total_uses,
        COALESCE(SUM(credit_value * current_uses), 0) AS credits_issued
      FROM redemption_keys
    `;

    const activeToday = await sql`
      SELECT COUNT(*) AS count FROM users WHERE last_active > NOW() - INTERVAL '24 hours'
    `;

    return Response.json({
      users: {
        total: parseInt(userStats.total_users),
        premium: parseInt(userStats.premium_users),
        banned: parseInt(userStats.banned_users),
        activeToday: parseInt(activeToday[0].count),
        totalCredits: parseInt(userStats.total_credits),
        totalHits: parseInt(userStats.total_hits),
      },
      generator: {
        sessions: parseInt(genStats.sessions),
        totalGenerated: parseInt(genStats.total_generated),
        creditsSpent: parseInt(genStats.credits_spent_gen),
      },
      checker: {
        sessions: parseInt(checkStats.sessions),
        totalChecked: parseInt(checkStats.total_checked),
        totalGood: parseInt(checkStats.total_good),
        totalBad: parseInt(checkStats.total_bad),
      },
      keys: {
        total: parseInt(keyStats.total_keys),
        active: parseInt(keyStats.active_keys),
        totalUses: parseInt(keyStats.total_uses),
        creditsIssued: parseInt(keyStats.credits_issued),
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
