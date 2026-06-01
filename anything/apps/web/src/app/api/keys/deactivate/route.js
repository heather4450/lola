import sql from "@/app/api/utils/sql";
import { getAdminFromToken } from "@/app/api/utils/jwtAuth";

export async function POST(request) {
  try {
    const admin = getAdminFromToken(request);
    if (!admin)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { keyId, activate } = await request.json();
    if (!keyId)
      return Response.json({ error: "Missing keyId" }, { status: 400 });

    const setActive = activate === true;
    const result = await sql`
      UPDATE redemption_keys SET is_active = ${setActive}
      WHERE id = ${keyId}
      RETURNING *
    `;
    if (!result[0])
      return Response.json({ error: "Key not found" }, { status: 404 });

    return Response.json({ success: true, key: result[0] });
  } catch (error) {
    console.error("Key deactivate error:", error);
    return Response.json({ error: "Failed to update key" }, { status: 500 });
  }
}
