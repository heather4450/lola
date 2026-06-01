import sql from "@/app/api/utils/sql";
import { createToken, validateTelegramData } from "@/app/api/utils/jwtAuth";
import { logJoin, logLogin, logError } from "@/app/api/utils/logger";
import crypto from "crypto";

// ADMIN_TELEGRAM_IDS=123456789,987654321  (comma-separated)
function isAdminTelegramId(telegramId) {
  const ids = (process.env.ADMIN_TELEGRAM_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.includes(String(telegramId));
}

function getIP(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

function getDevice(request) {
  const ua = request.headers.get("user-agent") || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac/i.test(ua)) return "macOS";
  return "Unknown";
}

export async function POST(request) {
  const ipAddress = getIP(request);
  const device = getDevice(request);

  try {
    const body = await request.json();
    const { initData, user: telegramUser } = body;

    // ── Outside-Telegram protection ───────────────────────────────────────────
    // In production: require real Telegram initData — never allow demo user
    const isProduction =
      process.env.NEXT_PUBLIC_CREATE_ENV === "PRODUCTION" ||
      process.env.NODE_ENV === "production";

    if (isProduction && !initData) {
      return Response.json(
        { error: "This app must be opened inside Telegram." },
        { status: 403 },
      );
    }

    // ── Validate Telegram initData signature ──────────────────────────────────
    if (initData && process.env.TELEGRAM_BOT_TOKEN) {
      const isValid = validateTelegramData(
        initData,
        process.env.TELEGRAM_BOT_TOKEN,
      );
      if (!isValid) {
        return Response.json(
          { error: "Invalid Telegram data" },
          { status: 401 },
        );
      }
    }

    // ── Resolve user data ─────────────────────────────────────────────────────
    let userData = telegramUser;
    if (!userData || !userData.id) {
      if (isProduction) {
        return Response.json(
          { error: "No Telegram user data provided." },
          { status: 400 },
        );
      }
      // Dev/preview fallback only
      userData = {
        id: 100000001,
        username: "demo_user",
        first_name: "Demo",
        last_name: "User",
        photo_url: null,
      };
    }

    const telegramId = userData.id;
    const isAdmin = isAdminTelegramId(telegramId);

    // ── Check if new user ─────────────────────────────────────────────────────
    const existing = await sql`
      SELECT id FROM users WHERE telegram_id = ${telegramId}
    `;
    const isNewUser = existing.length === 0;

    // ── Upsert user with role + last_login ────────────────────────────────────
    const result = await sql`
      INSERT INTO users (telegram_id, username, first_name, last_name, photo_url, last_active, last_login, role)
      VALUES (
        ${telegramId},
        ${userData.username || null},
        ${userData.first_name || null},
        ${userData.last_name || null},
        ${userData.photo_url || null},
        NOW(),
        NOW(),
        ${isAdmin ? "admin" : "user"}
      )
      ON CONFLICT (telegram_id) DO UPDATE SET
        username    = COALESCE(EXCLUDED.username,    users.username),
        first_name  = COALESCE(EXCLUDED.first_name,  users.first_name),
        last_name   = COALESCE(EXCLUDED.last_name,   users.last_name),
        photo_url   = COALESCE(EXCLUDED.photo_url,   users.photo_url),
        last_active = NOW(),
        last_login  = NOW(),
        role        = CASE WHEN ${isAdmin} THEN 'admin'::VARCHAR ELSE users.role END
      RETURNING *
    `;

    const user = result[0];
    if (!user) throw new Error("User upsert returned no row");

    if (user.is_banned) {
      return Response.json({ error: "Account is banned." }, { status: 403 });
    }

    // ── Session tracking ──────────────────────────────────────────────────────
    const sessionId = crypto.randomBytes(32).toString("hex");
    try {
      await sql`
        INSERT INTO sessions (session_id, telegram_id, user_id, device, ip_address, expires_at)
        VALUES (
          ${sessionId},
          ${telegramId},
          ${user.id},
          ${device},
          ${ipAddress},
          NOW() + INTERVAL '7 days'
        )
      `;
    } catch (sessionErr) {
      // Non-fatal — log but continue
      console.error("[auth] Session insert failed:", sessionErr?.message);
    }

    // ── Logger (fire-and-forget — never blocks the response) ─────────────────
    if (isNewUser) {
      logJoin({
        telegramId,
        userId: user.id,
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        ipAddress,
      }).catch(() => {});
    } else {
      logLogin({
        telegramId,
        userId: user.id,
        username: userData.username,
        firstName: userData.first_name,
        device,
        ipAddress,
      }).catch(() => {});
    }

    // ── Issue JWT ─────────────────────────────────────────────────────────────
    const token = createToken({
      userId: user.id,
      telegramId: user.telegram_id,
      isAdmin,
      role: user.role || (isAdmin ? "admin" : "user"),
      sessionId,
    });

    return Response.json({ token, user: { ...user, isAdmin } });
  } catch (error) {
    console.error("Auth error:", error);
    logError({ error, context: "auth/telegram", ipAddress }).catch(() => {});
    return Response.json({ error: "Authentication failed" }, { status: 500 });
  }
}
