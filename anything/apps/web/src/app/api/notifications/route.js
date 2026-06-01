import sql from "@/app/api/utils/sql";
import { getUserFromToken } from "@/app/api/utils/jwtAuth";

// GET /api/notifications — returns unread broadcasts for the current user
export async function GET(request) {
  const user = getUserFromToken(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.userId; // JWT stores it as userId, not id
  if (!userId)
    return Response.json({ error: "Invalid token" }, { status: 401 });

  try {
    const userIdArray = JSON.stringify([userId]);
    const notifications = await sql(
      `SELECT b.*
       FROM broadcasts b
       WHERE b.id NOT IN (
         SELECT broadcast_id FROM broadcast_reads WHERE user_id = $1
       )
       AND (
         b.target_type = 'all'
         OR (
           b.target_type = 'specific'
           AND b.target_user_ids @> $2::jsonb
         )
       )
       ORDER BY b.created_at DESC
       LIMIT 20`,
      [userId, userIdArray],
    );
    return Response.json({ notifications });
  } catch (err) {
    console.error("Notifications GET error:", err);
    return Response.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

// POST /api/notifications — mark one or all as read
export async function POST(request) {
  const user = getUserFromToken(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.userId; // JWT stores it as userId, not id
  if (!userId)
    return Response.json({ error: "Invalid token" }, { status: 401 });

  try {
    const { broadcast_id, mark_all } = await request.json();

    if (mark_all) {
      const userIdArray = JSON.stringify([userId]);
      await sql(
        `INSERT INTO broadcast_reads (broadcast_id, user_id)
         SELECT b.id, $1
         FROM broadcasts b
         WHERE b.target_type = 'all'
           OR b.target_user_ids @> $2::jsonb
         ON CONFLICT (broadcast_id, user_id) DO NOTHING`,
        [userId, userIdArray],
      );
    } else if (broadcast_id) {
      await sql(
        `INSERT INTO broadcast_reads (broadcast_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (broadcast_id, user_id) DO NOTHING`,
        [broadcast_id, userId],
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Notifications POST error:", err);
    return Response.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
