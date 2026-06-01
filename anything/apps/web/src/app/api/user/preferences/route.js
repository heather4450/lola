import sql from "@/app/api/utils/sql";
import { getUserFromToken } from "@/app/api/utils/jwtAuth";

export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const result = await sql`
      SELECT theme_preference, notification_preferences
      FROM users WHERE id = ${user.userId}
    `;
    return Response.json({
      theme: result[0]?.theme_preference || "dark",
      notifications: result[0]?.notification_preferences || {
        hits: true,
        milestones: true,
        all: false,
      },
    });
  } catch (error) {
    console.error("Preferences GET error:", error);
    return Response.json(
      { error: "Failed to load preferences" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { theme, notifications } = await request.json();

    if (theme) {
      const safeTheme = theme === "light" ? "light" : "dark";
      await sql`UPDATE users SET theme_preference = ${safeTheme} WHERE id = ${user.userId}`;
    }
    if (notifications && typeof notifications === "object") {
      await sql`
        UPDATE users SET notification_preferences = ${JSON.stringify(notifications)}::jsonb
        WHERE id = ${user.userId}
      `;
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("Preferences POST error:", error);
    return Response.json(
      { error: "Failed to save preferences" },
      { status: 500 },
    );
  }
}
