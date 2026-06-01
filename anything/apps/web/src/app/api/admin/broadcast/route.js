import sql from "@/app/api/utils/sql";
import { getAdminFromToken } from "@/app/api/utils/jwtAuth";

const STATIC_GATEWAYS = [
  "Luhn + BIN Check",
  "Stripe Auth",
  "Braintree Auth",
  "Shopify 10-50$",
  "PayPal Auth",
  "Square Auth",
];

export async function GET(request) {
  const admin = getAdminFromToken(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const broadcasts = await sql`
      SELECT * FROM broadcasts ORDER BY created_at DESC LIMIT 100
    `;
    return Response.json({ broadcasts });
  } catch (err) {
    console.error("Broadcast GET error:", err);
    return Response.json(
      { error: "Failed to fetch broadcasts" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const admin = getAdminFromToken(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, body, target_type, target_user_ids, send_telegram } =
      await request.json();

    if (!title || !body) {
      return Response.json(
        { error: "Title and body are required" },
        { status: 400 },
      );
    }

    const targetType = target_type || "all";
    const targetIds = Array.isArray(target_user_ids) ? target_user_ids : [];

    // Determine recipients
    let recipients = [];
    if (targetType === "all") {
      const users =
        await sql`SELECT telegram_id FROM users WHERE is_banned = false`;
      recipients = users.map((u) => u.telegram_id).filter(Boolean);
    } else if (targetIds.length > 0) {
      const users =
        await sql`SELECT telegram_id FROM users WHERE id = ANY(${targetIds}) AND is_banned = false`;
      recipients = users.map((u) => u.telegram_id).filter(Boolean);
    }

    const telegramAttempted = !!(
      send_telegram && process.env.TELEGRAM_BOT_TOKEN
    );

    // Insert broadcast record
    const rows = await sql`
      INSERT INTO broadcasts (title, body, target_type, target_user_ids, delivery_count, telegram_attempted)
      VALUES (
        ${title.trim()},
        ${body.trim()},
        ${targetType},
        ${JSON.stringify(targetIds)},
        ${recipients.length},
        ${telegramAttempted}
      )
      RETURNING *
    `;
    const broadcast = rows[0];

    // Send Telegram messages if requested
    if (telegramAttempted && recipients.length > 0) {
      const message = `📢 *${title.trim()}*\n\n${body.trim()}`;
      const sendMsg = (chatId) =>
        fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: "Markdown",
            }),
          },
        ).catch(() => {});

      // Fire-and-forget in batches of 10
      for (let i = 0; i < recipients.length; i += 10) {
        await Promise.allSettled(recipients.slice(i, i + 10).map(sendMsg));
      }
    }

    return Response.json({
      success: true,
      broadcast,
      recipientCount: recipients.length,
    });
  } catch (err) {
    console.error("Broadcast POST error:", err);
    return Response.json(
      { error: "Failed to create broadcast" },
      { status: 500 },
    );
  }
}
