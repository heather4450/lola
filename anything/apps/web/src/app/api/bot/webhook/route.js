import sql from "@/app/api/utils/sql";
import crypto from "crypto";

// ── Helpers ────────────────────────────────────────────────────────────────

function isAdminId(telegramId) {
  const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return adminIds.includes(String(telegramId));
}

async function sendMessage(chatId, text, extra = {}) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          ...extra,
        }),
      },
    );
  } catch (err) {
    console.error("[bot] sendMessage error:", err);
  }
}

// ── Main handler ───────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    // 1. Validate the webhook secret — Telegram sends this header on every update
    const incomingSecret = request.headers.get(
      "x-telegram-bot-api-secret-token",
    );
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!expectedSecret) {
      // Webhook secret not configured — refuse all updates
      return Response.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    if (
      !incomingSecret ||
      incomingSecret.length !== expectedSecret.length ||
      !crypto.timingSafeEqual(
        Buffer.from(incomingSecret),
        Buffer.from(expectedSecret),
      )
    ) {
      // Invalid secret — silently return 200 so Telegram doesn't retry
      return Response.json({ ok: true });
    }

    // 2. Parse update
    const update = await request.json();
    const message = update.message || update.edited_message;
    if (!message || !message.text) {
      return Response.json({ ok: true });
    }

    const chatId = message.chat.id;
    const fromId = message.from?.id;
    const text = message.text.trim();
    const isAdmin = isAdminId(fromId);
    const appUrl = process.env.NEXT_PUBLIC_CREATE_APP_URL || "";

    // ── /start ──────────────────────────────────────────────────────────────
    if (text === "/start" || text.startsWith("/start ")) {
      const firstName = message.from?.first_name || "there";
      await sendMessage(
        chatId,
        `👋 Hey <b>${firstName}</b>! Welcome to <b>BIN Checker</b>!\n\n` +
          `🔍 Check cards, lookup BINs, and generate test data.\n` +
          `💎 You get <b>100 free credits</b> to start!\n\n` +
          `Tap the button below to open the app 👇`,
        appUrl
          ? {
              reply_markup: {
                inline_keyboard: [
                  [{ text: "🚀 Open BIN Checker", web_app: { url: appUrl } }],
                ],
              },
            }
          : {},
      );
      return Response.json({ ok: true });
    }

    // ── /help ───────────────────────────────────────────────────────────────
    if (text === "/help") {
      let helpText =
        `📚 <b>BIN Checker — Commands</b>\n\n` +
        `/start — Open the mini app\n` +
        `/help — Show this message`;

      if (isAdmin) {
        helpText +=
          `\n\n👑 <b>Admin Commands</b>\n` +
          `/stats — Platform statistics\n` +
          `/broadcast &lt;msg&gt; — Send message to all users\n` +
          `/addcredits &lt;userId&gt; &lt;amount&gt; — Add credits\n` +
          `/ban &lt;userId&gt; — Ban a user\n` +
          `/unban &lt;userId&gt; — Unban a user\n` +
          `/userinfo &lt;userId&gt; — Get user details`;
      }
      await sendMessage(chatId, helpText);
      return Response.json({ ok: true });
    }

    // ── Guard: non-admins cannot use admin commands ─────────────────────────
    if (!isAdmin) {
      if (text.startsWith("/") && text !== "/start") {
        await sendMessage(
          chatId,
          "❌ Unknown command. Use /help to see available commands.",
        );
      }
      return Response.json({ ok: true });
    }

    // ── /stats ──────────────────────────────────────────────────────────────
    if (text === "/stats") {
      const rows = await sql`
        SELECT
          COUNT(*)::int                                                          AS total_users,
          COALESCE(SUM(credits), 0)::int                                         AS total_credits,
          COALESCE(SUM(total_hits), 0)::int                                      AS total_hits,
          COUNT(CASE WHEN is_banned    THEN 1 END)::int                          AS banned_count,
          COUNT(CASE WHEN is_premium   THEN 1 END)::int                          AS premium_count,
          COUNT(CASE WHEN last_active > NOW() - INTERVAL '24 hours' THEN 1 END)::int AS active_today
        FROM users
      `;
      const s = rows[0];
      await sendMessage(
        chatId,
        `📊 <b>Platform Statistics</b>\n\n` +
          `👥 Total Users: <b>${s.total_users}</b>\n` +
          `🟢 Active Today: <b>${s.active_today}</b>\n` +
          `💳 Total Hits: <b>${s.total_hits}</b>\n` +
          `💰 Credits in System: <b>${s.total_credits}</b>\n` +
          `👑 Premium Users: <b>${s.premium_count}</b>\n` +
          `🚫 Banned Users: <b>${s.banned_count}</b>`,
      );
      return Response.json({ ok: true });
    }

    // ── /broadcast <message> ────────────────────────────────────────────────
    if (text.startsWith("/broadcast ")) {
      const broadcastMsg = text.slice("/broadcast ".length).trim();
      if (!broadcastMsg) {
        await sendMessage(chatId, "❌ Usage: /broadcast &lt;your message&gt;");
        return Response.json({ ok: true });
      }

      const users =
        await sql`SELECT telegram_id FROM users WHERE is_banned = false`;
      await sendMessage(chatId, `📤 Sending to <b>${users.length}</b> users…`);

      let sent = 0;
      let failed = 0;
      for (const u of users) {
        try {
          const r = await fetch(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: u.telegram_id,
                text: `📢 <b>Announcement</b>\n\n${broadcastMsg}`,
                parse_mode: "HTML",
              }),
            },
          );
          if (r.ok) {
            sent++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
        // Rate-limit safe delay
        await new Promise((r) => setTimeout(r, 60));
      }

      await sql`
        INSERT INTO broadcasts (title, body, target_type, delivery_count, telegram_attempted)
        VALUES ('Bot Broadcast', ${broadcastMsg}, 'all', ${sent}, true)
      `;

      await sendMessage(
        chatId,
        `✅ Broadcast complete!\n📤 Sent: <b>${sent}</b>\n❌ Failed: <b>${failed}</b>`,
      );
      return Response.json({ ok: true });
    }

    // ── /addcredits <userId> <amount> ───────────────────────────────────────
    if (text.startsWith("/addcredits ")) {
      const parts = text.split(" ");
      const userId = parseInt(parts[1]);
      const amount = parseInt(parts[2]);

      if (!userId || !amount || isNaN(userId) || isNaN(amount) || amount <= 0) {
        await sendMessage(
          chatId,
          "❌ Usage: /addcredits &lt;userId&gt; &lt;amount&gt;",
        );
        return Response.json({ ok: true });
      }

      const updated = await sql`
        UPDATE users SET credits = credits + ${amount}
        WHERE id = ${userId}
        RETURNING id, username, credits
      `;

      if (!updated[0]) {
        await sendMessage(
          chatId,
          `❌ User ID <code>${userId}</code> not found.`,
        );
        return Response.json({ ok: true });
      }

      await sql`
        INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
        VALUES (${userId}, ${amount}, 'admin_grant', 'Credits added via bot admin command')
      `;

      const u = updated[0];
      await sendMessage(
        chatId,
        `✅ Added <b>${amount}</b> credits to @${u.username || u.id}\n` +
          `💰 New balance: <b>${u.credits}</b>`,
      );
      return Response.json({ ok: true });
    }

    // ── /ban <userId> ───────────────────────────────────────────────────────
    if (text.startsWith("/ban ")) {
      const userId = parseInt(text.split(" ")[1]);
      if (!userId || isNaN(userId)) {
        await sendMessage(chatId, "❌ Usage: /ban &lt;userId&gt;");
        return Response.json({ ok: true });
      }
      const updated = await sql`
        UPDATE users SET is_banned = true
        WHERE id = ${userId}
        RETURNING id, username
      `;
      if (!updated[0]) {
        await sendMessage(
          chatId,
          `❌ User ID <code>${userId}</code> not found.`,
        );
      } else {
        await sendMessage(
          chatId,
          `🚫 User @${updated[0].username || userId} has been <b>banned</b>.`,
        );
      }
      return Response.json({ ok: true });
    }

    // ── /unban <userId> ─────────────────────────────────────────────────────
    if (text.startsWith("/unban ")) {
      const userId = parseInt(text.split(" ")[1]);
      if (!userId || isNaN(userId)) {
        await sendMessage(chatId, "❌ Usage: /unban &lt;userId&gt;");
        return Response.json({ ok: true });
      }
      const updated = await sql`
        UPDATE users SET is_banned = false
        WHERE id = ${userId}
        RETURNING id, username
      `;
      if (!updated[0]) {
        await sendMessage(
          chatId,
          `❌ User ID <code>${userId}</code> not found.`,
        );
      } else {
        await sendMessage(
          chatId,
          `✅ User @${updated[0].username || userId} has been <b>unbanned</b>.`,
        );
      }
      return Response.json({ ok: true });
    }

    // ── /userinfo <userId> ──────────────────────────────────────────────────
    if (text.startsWith("/userinfo ")) {
      const userId = parseInt(text.split(" ")[1]);
      if (!userId || isNaN(userId)) {
        await sendMessage(chatId, "❌ Usage: /userinfo &lt;userId&gt;");
        return Response.json({ ok: true });
      }
      const users = await sql`SELECT * FROM users WHERE id = ${userId}`;
      if (!users[0]) {
        await sendMessage(
          chatId,
          `❌ User ID <code>${userId}</code> not found.`,
        );
      } else {
        const u = users[0];
        await sendMessage(
          chatId,
          `👤 <b>User Info</b>\n\n` +
            `ID: <code>${u.id}</code>\n` +
            `Telegram ID: <code>${u.telegram_id}</code>\n` +
            `Username: @${u.username || "N/A"}\n` +
            `Name: ${[u.first_name, u.last_name].filter(Boolean).join(" ") || "N/A"}\n` +
            `Credits: <b>${u.credits}</b>\n` +
            `Total Hits: <b>${u.total_hits || 0}</b>\n` +
            `Premium: ${u.is_premium ? "✅ Yes" : "❌ No"}\n` +
            `Banned: ${u.is_banned ? "🚫 Yes" : "✅ No"}\n` +
            `Joined: ${new Date(u.created_at).toLocaleDateString()}\n` +
            `Last Active: ${new Date(u.last_active).toLocaleDateString()}`,
        );
      }
      return Response.json({ ok: true });
    }

    // ── Unknown command ─────────────────────────────────────────────────────
    if (text.startsWith("/")) {
      await sendMessage(
        chatId,
        "❓ Unknown command. Use /help to see all available commands.",
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[bot/webhook] error:", error);
    // Always return 200 so Telegram doesn't keep retrying
    return Response.json({ ok: true });
  }
}
