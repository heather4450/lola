import sql from "@/app/api/utils/sql";
import { getAdminFromToken } from "@/app/api/utils/jwtAuth";
import crypto from "crypto";

function generateKeyCode() {
  const part = () => crypto.randomBytes(2).toString("hex").toUpperCase();
  return `BCK-${part()}-${part()}-${part()}`;
}

export async function POST(request) {
  try {
    const admin = getAdminFromToken(request);
    if (!admin)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { credit_value, max_uses, expires_in_days, count, note } =
      await request.json();
    const credits = parseInt(credit_value);
    const maxUses = parseInt(max_uses || 1);
    const numKeys = Math.min(Math.max(parseInt(count || 1), 1), 100);

    if (!credits || credits < 1 || credits > 100000) {
      return Response.json(
        { error: "Invalid credit value (1-100000)" },
        { status: 400 },
      );
    }
    if (maxUses < 1 || maxUses > 10000) {
      return Response.json(
        { error: "Invalid max uses (1-10000)" },
        { status: 400 },
      );
    }

    let expiresAt = null;
    if (expires_in_days && parseInt(expires_in_days) > 0) {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(expires_in_days));
      expiresAt = d.toISOString();
    }

    const created = [];
    for (let i = 0; i < numKeys; i++) {
      let code;
      let inserted = null;
      for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
        code = generateKeyCode();
        const result = await sql`
          INSERT INTO redemption_keys (key_code, credit_value, max_uses, expires_at, note)
          VALUES (${code}, ${credits}, ${maxUses}, ${expiresAt}, ${note || null})
          ON CONFLICT (key_code) DO NOTHING
          RETURNING *
        `;
        if (result[0]) inserted = result[0];
      }
      if (inserted) created.push(inserted);
    }

    return Response.json({
      success: true,
      keys: created,
      count: created.length,
    });
  } catch (error) {
    console.error("Key create error:", error);
    return Response.json({ error: "Failed to create key" }, { status: 500 });
  }
}
