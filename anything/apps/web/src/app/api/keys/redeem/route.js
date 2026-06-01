import sql from "@/app/api/utils/sql";
import { getUserFromToken } from "@/app/api/utils/jwtAuth";

export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await request.json();
    const cleanCode = String(code || "")
      .trim()
      .toUpperCase();
    if (!cleanCode) {
      return Response.json({ error: "Please enter a key" }, { status: 400 });
    }

    const keyRows = await sql`
      SELECT * FROM redemption_keys WHERE key_code = ${cleanCode}
    `;
    const key = keyRows[0];
    if (!key) {
      return Response.json({ error: "Invalid key" }, { status: 404 });
    }
    if (!key.is_active) {
      return Response.json(
        { error: "This key has been deactivated" },
        { status: 400 },
      );
    }
    if (key.expires_at && new Date(key.expires_at) <= new Date()) {
      return Response.json({ error: "This key has expired" }, { status: 400 });
    }
    if (key.current_uses >= key.max_uses) {
      return Response.json(
        { error: "This key has reached its maximum uses" },
        { status: 400 },
      );
    }

    const existing = await sql`
      SELECT id FROM key_redemptions WHERE key_id = ${key.id} AND user_id = ${user.userId}
    `;
    if (existing[0]) {
      return Response.json(
        { error: "You have already redeemed this key" },
        { status: 400 },
      );
    }

    await sql.transaction([
      sql`UPDATE redemption_keys SET current_uses = current_uses + 1 WHERE id = ${key.id}`,
      sql`UPDATE users SET credits = credits + ${key.credit_value} WHERE id = ${user.userId}`,
      sql`INSERT INTO key_redemptions (key_id, user_id, credits_granted) VALUES (${key.id}, ${user.userId}, ${key.credit_value})`,
      sql`INSERT INTO credit_transactions (user_id, amount, transaction_type, description) VALUES (${user.userId}, ${key.credit_value}, 'key_redemption', ${`Redeemed key ${cleanCode}`})`,
    ]);

    const updated =
      await sql`SELECT credits FROM users WHERE id = ${user.userId}`;

    return Response.json({
      success: true,
      creditsGranted: key.credit_value,
      newBalance: updated[0].credits,
      message: `+${key.credit_value} credits added!`,
    });
  } catch (error) {
    console.error("Key redeem error:", error);
    return Response.json({ error: "Redemption failed" }, { status: 500 });
  }
}
