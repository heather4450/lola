import sql from "@/app/api/utils/sql";
import { getUserFromToken } from "@/app/api/utils/jwtAuth";

export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";

    let genLogs = [];
    let checkLogs = [];

    if (type === "all" || type === "generator") {
      genLogs = await sql`
        SELECT id, bin_prefix, amount, credits_used, created_at
        FROM generated_logs
        WHERE user_id = ${user.userId}
        ORDER BY created_at DESC
        LIMIT 20
      `;
    }
    if (type === "all" || type === "checker") {
      checkLogs = await sql`
        SELECT id, lines_checked, lines_good, lines_bad, credits_used, created_at
        FROM checker_logs
        WHERE user_id = ${user.userId}
        ORDER BY created_at DESC
        LIMIT 20
      `;
    }

    return Response.json({ generatorLogs: genLogs, checkerLogs: checkLogs });
  } catch (error) {
    console.error("Logs error:", error);
    return Response.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
