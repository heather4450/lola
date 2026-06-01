import sql from "@/app/api/utils/sql";
import { getAdminFromToken } from "@/app/api/utils/jwtAuth";

export async function GET(request) {
  try {
    const admin = getAdminFromToken(request);
    if (!admin)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    let keys;
    if (status === "active") {
      keys = await sql`
        SELECT * FROM redemption_keys
        WHERE is_active = true
          AND current_uses < max_uses
          AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at DESC LIMIT 200
      `;
    } else if (status === "expired") {
      keys = await sql`
        SELECT * FROM redemption_keys
        WHERE (expires_at IS NOT NULL AND expires_at <= NOW())
           OR current_uses >= max_uses
           OR is_active = false
        ORDER BY created_at DESC LIMIT 200
      `;
    } else {
      keys =
        await sql`SELECT * FROM redemption_keys ORDER BY created_at DESC LIMIT 200`;
    }

    const recentRedemptions = await sql`
      SELECT r.*, u.username, u.first_name, u.telegram_id, rk.key_code
      FROM key_redemptions r
      LEFT JOIN users u ON u.id = r.user_id
      LEFT JOIN redemption_keys rk ON rk.id = r.key_id
      ORDER BY r.redeemed_at DESC LIMIT 30
    `;

    return Response.json({ keys, recentRedemptions });
  } catch (error) {
    console.error("Key list error:", error);
    return Response.json({ error: "Failed to list keys" }, { status: 500 });
  }
}
