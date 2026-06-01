/**
 * Logger Bot Utility
 * Uses a SEPARATE bot token (LOGGER_BOT_TOKEN) from the main bot.
 * Forwards all logs to LOGGER_CHANNEL_ID (a dedicated Telegram channel).
 * Never exposed to the frontend.
 */
import sql from "@/app/api/utils/sql";

const LOGGER_TOKEN = process.env.LOGGER_BOT_TOKEN;
const CHANNEL_ID = process.env.LOGGER_CHANNEL_ID;

// ── Send to Telegram channel ─────────────────────────────────────────────────
async function sendToChannel(text) {
  if (!LOGGER_TOKEN || !CHANNEL_ID) return; // silently skip if not configured
  try {
    await fetch(`https://api.telegram.org/bot${LOGGER_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        text,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    // Never let logger failures break main app
    console.error("[logger] Telegram send failed:", err?.message);
  }
}

// ── Write to DB logs table ───────────────────────────────────────────────────
async function writeLog(
  action,
  telegramId,
  userId,
  metadata = {},
  ipAddress = null,
) {
  try {
    await sql`
      INSERT INTO logs (telegram_id, user_id, action, metadata, ip_address)
      VALUES (
        ${telegramId || null},
        ${userId || null},
        ${action},
        ${JSON.stringify(metadata)}::jsonb,
        ${ipAddress || null}
      )
    `;
  } catch (err) {
    console.error("[logger] DB write failed:", err?.message);
  }
}

// ── Helper: format timestamp ─────────────────────────────────────────────────
function ts() {
  return new Date().toUTCString();
}

// ── Public log functions ─────────────────────────────────────────────────────

/**
 * Fired when a new user joins for the first time.
 */
export async function logJoin({
  telegramId,
  userId,
  username,
  firstName,
  lastName,
  ipAddress,
}) {
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
  await Promise.all([
    writeLog("user_join", telegramId, userId, { username, name }, ipAddress),
    sendToChannel(
      `🆕 <b>NEW USER JOINED</b>\n\n` +
        `👤 Name: <b>${name}</b>\n` +
        `🔖 Username: @${username || "N/A"}\n` +
        `🆔 Telegram ID: <code>${telegramId}</code>\n` +
        `🗃 DB ID: <code>${userId}</code>\n` +
        `🌐 IP: <code>${ipAddress || "N/A"}</code>\n` +
        `⏱ ${ts()}`,
    ),
  ]);
}

/**
 * Fired on every login (existing user).
 */
export async function logLogin({
  telegramId,
  userId,
  username,
  firstName,
  device,
  ipAddress,
}) {
  await Promise.all([
    writeLog(
      "user_login",
      telegramId,
      userId,
      { username, firstName, device },
      ipAddress,
    ),
    sendToChannel(
      `🔐 <b>USER LOGIN</b>\n\n` +
        `👤 ${firstName || username || "Unknown"} (@${username || "N/A"})\n` +
        `🆔 Telegram ID: <code>${telegramId}</code>\n` +
        `📱 Device: ${device || "Unknown"}\n` +
        `🌐 IP: <code>${ipAddress || "N/A"}</code>\n` +
        `⏱ ${ts()}`,
    ),
  ]);
}

/**
 * Fired on key activity events (checker hit, generator use, key redeem, etc).
 */
export async function logActivity({
  telegramId,
  userId,
  action,
  metadata = {},
  ipAddress,
}) {
  const icons = {
    checker_hit: "✅",
    checker_run: "🔍",
    generator_run: "⚙️",
    key_redeem: "🔑",
    credits_spent: "💳",
    premium_granted: "👑",
    banned: "🚫",
    unbanned: "✅",
  };
  const icon = icons[action] || "📌";
  const lines = Object.entries(metadata)
    .map(([k, v]) => `  • ${k}: <code>${v}</code>`)
    .join("\n");

  await Promise.all([
    writeLog(action, telegramId, userId, metadata, ipAddress),
    sendToChannel(
      `${icon} <b>ACTIVITY: ${action.toUpperCase().replace(/_/g, " ")}</b>\n\n` +
        `🆔 Telegram ID: <code>${telegramId || "N/A"}</code>\n` +
        (lines ? `${lines}\n` : "") +
        `⏱ ${ts()}`,
    ),
  ]);
}

/**
 * Fired on errors in critical paths.
 */
export async function logError({
  error,
  context,
  telegramId,
  userId,
  ipAddress,
}) {
  await Promise.all([
    writeLog(
      "error",
      telegramId,
      userId,
      { error: String(error), context },
      ipAddress,
    ),
    sendToChannel(
      `🚨 <b>ERROR</b>\n\n` +
        `📍 Context: <code>${context || "unknown"}</code>\n` +
        `❌ Error: <code>${String(error).slice(0, 300)}</code>\n` +
        (telegramId ? `🆔 Telegram ID: <code>${telegramId}</code>\n` : "") +
        `⏱ ${ts()}`,
    ),
  ]);
}

/**
 * Fired on any purchase / credit-related payment event.
 */
export async function logPurchase({
  telegramId,
  userId,
  username,
  amount,
  type,
  description,
  ipAddress,
}) {
  await Promise.all([
    writeLog(
      "purchase",
      telegramId,
      userId,
      { amount, type, description },
      ipAddress,
    ),
    sendToChannel(
      `💰 <b>PURCHASE / CREDIT EVENT</b>\n\n` +
        `👤 @${username || "N/A"} — ID <code>${telegramId}</code>\n` +
        `💵 Amount: <b>${amount > 0 ? "+" : ""}${amount} credits</b>\n` +
        `🏷 Type: <code>${type}</code>\n` +
        `📝 Note: ${description || "N/A"}\n` +
        `⏱ ${ts()}`,
    ),
  ]);
}
