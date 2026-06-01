import sql from "@/app/api/utils/sql";
import { getAdminFromToken } from "@/app/api/utils/jwtAuth";

export async function GET(request) {
  try {
    const admin = getAdminFromToken(request);
    if (!admin)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "last_active";
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

    const sortMap = {
      hits: "total_hits DESC",
      credits: "credits DESC",
      last_active: "last_active DESC",
      created: "created_at DESC",
    };
    const orderBy = sortMap[sort] || sortMap.last_active;

    let users;
    if (search) {
      const pat = `%${search.toLowerCase()}%`;
      users = await sql(
        `SELECT id, telegram_id, username, first_name, last_name, photo_url,
                credits, is_premium, premium_until, total_hits, is_banned,
                created_at, last_active
         FROM users
         WHERE LOWER(COALESCE(username, '')) LIKE $1
            OR LOWER(COALESCE(first_name, '')) LIKE $1
            OR LOWER(COALESCE(last_name, '')) LIKE $1
            OR CAST(telegram_id AS TEXT) LIKE $1
         ORDER BY ${orderBy}
         LIMIT $2`,
        [pat, limit],
      );
    } else {
      users = await sql(
        `SELECT id, telegram_id, username, first_name, last_name, photo_url,
                credits, is_premium, premium_until, total_hits, is_banned,
                created_at, last_active
         FROM users ORDER BY ${orderBy} LIMIT $1`,
        [limit],
      );
    }

    return Response.json({ users, count: users.length });
  } catch (error) {
    console.error("Admin users error:", error);
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
