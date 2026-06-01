import sql from "@/app/api/utils/sql";
import { getAdminFromToken } from "@/app/api/utils/jwtAuth";

export async function POST(request) {
  try {
    const admin = getAdminFromToken(request);
    if (!admin)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { keyId } = await request.json();
    if (!keyId)
      return Response.json({ error: "Missing keyId" }, { status: 400 });

    // Delete redemption records first (FK constraint)
    await sql`DELETE FROM key_redemptions WHERE key_id = ${keyId}`;
    const result =
      await sql`DELETE FROM redemption_keys WHERE id = ${keyId} RETURNING id`;

    if (!result[0])
      return Response.json({ error: "Key not found" }, { status: 404 });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Key delete error:", error);
    return Response.json({ error: "Failed to delete key" }, { status: 500 });
  }
}
