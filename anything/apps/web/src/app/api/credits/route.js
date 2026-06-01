import sql from "@/app/api/utils/sql";
import { getUserFromToken } from "@/app/api/utils/jwtAuth";

export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const result =
      await sql`SELECT credits, is_premium FROM users WHERE id = ${user.userId}`;
    const transactions = await sql`
      SELECT amount, transaction_type, description, created_at
      FROM credit_transactions
      WHERE user_id = ${user.userId}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return Response.json({
      credits: result[0]?.credits || 0,
      isPremium: result[0]?.is_premium || false,
      transactions,
    });
  } catch (error) {
    console.error("Credits error:", error);
    return Response.json({ error: "Failed to fetch credits" }, { status: 500 });
  }
}
