import sql from "@/app/api/utils/sql";
import { getAdminFromToken } from "@/app/api/utils/jwtAuth";

export async function POST(request) {
  try {
    const admin = getAdminFromToken(request);
    if (!admin)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { userId, action, payload } = await request.json();
    if (!userId || !action) {
      return Response.json(
        { error: "Missing userId or action" },
        { status: 400 },
      );
    }

    const userRows = await sql`SELECT id FROM users WHERE id = ${userId}`;
    if (!userRows[0])
      return Response.json({ error: "User not found" }, { status: 404 });

    switch (action) {
      case "grant_premium": {
        const days = parseInt(payload?.days || 30);
        await sql`
          UPDATE users
          SET is_premium = true,
              premium_until = COALESCE(premium_until, NOW()) + (${days} || ' days')::interval
          WHERE id = ${userId}
        `;
        break;
      }
      case "revoke_premium": {
        await sql`UPDATE users SET is_premium = false, premium_until = NULL WHERE id = ${userId}`;
        break;
      }
      case "add_credits": {
        const amount = parseInt(payload?.amount || 0);
        if (amount === 0)
          return Response.json({ error: "Invalid amount" }, { status: 400 });
        await sql`UPDATE users SET credits = GREATEST(0, credits + ${amount}) WHERE id = ${userId}`;
        await sql`
          INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
          VALUES (${userId}, ${amount}, 'admin_grant', ${`Admin ${amount > 0 ? "added" : "removed"} ${Math.abs(amount)} credits`})
        `;
        break;
      }
      case "ban": {
        await sql`UPDATE users SET is_banned = true WHERE id = ${userId}`;
        break;
      }
      case "unban": {
        await sql`UPDATE users SET is_banned = false WHERE id = ${userId}`;
        break;
      }
      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }

    await sql`
      INSERT INTO admin_actions (action_type, target_user_id, payload)
      VALUES (${action}, ${userId}, ${JSON.stringify(payload || {})}::jsonb)
    `;

    const updated = await sql`
      SELECT id, credits, is_premium, premium_until, is_banned, total_hits
      FROM users WHERE id = ${userId}
    `;
    return Response.json({ success: true, user: updated[0] });
  } catch (error) {
    console.error("Admin action error:", error);
    return Response.json({ error: "Action failed" }, { status: 500 });
  }
}
