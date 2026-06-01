import sql from "@/app/api/utils/sql";
import { getUserFromToken } from "@/app/api/utils/jwtAuth";
import { generateCardLine } from "@/app/api/utils/luhn";

export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    const body = await request.json();
    const { prefix, amount } = body;

    if (!prefix || prefix.length < 4 || prefix.length > 16) {
      return Response.json(
        { error: "Invalid prefix. Must be 4–16 digits." },
        { status: 400 },
      );
    }
    if (!/^\d+$/.test(prefix)) {
      return Response.json(
        { error: "Prefix must contain digits only." },
        { status: 400 },
      );
    }

    const parsedAmount = parseInt(amount);
    if (!parsedAmount || parsedAmount < 1 || parsedAmount > 2000) {
      return Response.json(
        { error: "Amount must be between 1 and 2000." },
        { status: 400 },
      );
    }

    if (user) {
      const userResult =
        await sql`SELECT is_banned FROM users WHERE id = ${user.userId}`;
      if (userResult[0]?.is_banned) {
        return Response.json({ error: "Account is banned." }, { status: 403 });
      }
    }

    const lines = [];
    for (let i = 0; i < parsedAmount; i++) {
      lines.push(generateCardLine(prefix));
    }

    if (user) {
      await sql`
        INSERT INTO generated_logs (user_id, bin_prefix, amount, credits_used)
        VALUES (${user.userId}, ${prefix}, ${parsedAmount}, 0)
      `;
    }

    return Response.json({ lines, total: lines.length, creditCost: 0, prefix });
  } catch (error) {
    console.error("Generator error:", error);
    return Response.json({ error: "Generation failed" }, { status: 500 });
  }
}
