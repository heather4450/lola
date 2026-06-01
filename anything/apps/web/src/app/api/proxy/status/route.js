import sql from "@/app/api/utils/sql";
import { getUserFromToken } from "@/app/api/utils/jwtAuth";

export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) return Response.json({ active: false, count: 0, proxies: [] });

    const result =
      await sql`SELECT * FROM proxy_configs WHERE user_id = ${user.userId}`;
    if (!result[0])
      return Response.json({ active: false, count: 0, proxies: [] });

    const proxies = result[0].proxy_list
      ? result[0].proxy_list.split("\n").filter((p) => p.trim())
      : [];
    return Response.json({
      active: result[0].is_active,
      count: proxies.length,
      proxies,
      type: result[0].proxy_type,
    });
  } catch (error) {
    console.error("Proxy GET error:", error);
    return Response.json(
      { error: "Failed to fetch proxy status" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { proxy_list, is_active, proxy_type } = body;

    await sql`
      INSERT INTO proxy_configs (user_id, proxy_list, is_active, proxy_type, updated_at)
      VALUES (${user.userId}, ${proxy_list || ""}, ${is_active ?? false}, ${proxy_type || "http"}, NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET
        proxy_list = EXCLUDED.proxy_list,
        is_active = EXCLUDED.is_active,
        proxy_type = EXCLUDED.proxy_type,
        updated_at = NOW()
    `;

    const proxies = proxy_list
      ? proxy_list.split("\n").filter((p) => p.trim())
      : [];
    return Response.json({
      success: true,
      count: proxies.length,
      active: is_active,
    });
  } catch (error) {
    console.error("Proxy POST error:", error);
    return Response.json(
      { error: "Failed to save proxy config" },
      { status: 500 },
    );
  }
}
