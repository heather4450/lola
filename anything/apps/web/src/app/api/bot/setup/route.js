import { getAdminFromToken } from "@/app/api/utils/jwtAuth";

export async function POST(request) {
  const admin = getAdminFromToken(request);
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_CREATE_APP_URL;

  if (!botToken) {
    return Response.json(
      { error: "TELEGRAM_BOT_TOKEN is not set in env variables." },
      { status: 400 },
    );
  }
  if (!webhookSecret) {
    return Response.json(
      { error: "TELEGRAM_WEBHOOK_SECRET is not set in env variables." },
      { status: 400 },
    );
  }
  if (!appUrl) {
    return Response.json(
      { error: "NEXT_PUBLIC_CREATE_APP_URL is not set." },
      { status: 400 },
    );
  }

  const webhookUrl = `${appUrl}/api/bot/webhook`;

  try {
    // Register the webhook with Telegram
    const setRes = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: webhookSecret,
          allowed_updates: ["message", "edited_message"],
          drop_pending_updates: true,
        }),
      },
    );
    const setData = await setRes.json();

    if (!setData.ok) {
      return Response.json(
        { error: `Telegram error: ${setData.description}` },
        { status: 400 },
      );
    }

    // Set public bot command list (only non-admin ones shown to everyone)
    await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          { command: "start", description: "Open BIN Checker mini app" },
          { command: "help", description: "Show available commands" },
        ],
      }),
    });

    return Response.json({ success: true, webhookUrl });
  } catch (err) {
    console.error("[bot/setup] error:", err);
    return Response.json(
      { error: "Failed to register webhook" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  const admin = getAdminFromToken(request);
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return Response.json({
      configured: false,
      error: "TELEGRAM_BOT_TOKEN not set",
    });
  }

  try {
    const [infoRes, webhookRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${botToken}/getMe`),
      fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`),
    ]);
    const info = await infoRes.json();
    const webhook = await webhookRes.json();

    return Response.json({
      configured: true,
      bot: info.ok ? info.result : null,
      webhook: webhook.ok ? webhook.result : null,
    });
  } catch (err) {
    console.error("[bot/setup] GET error:", err);
    return Response.json({
      configured: false,
      error: "Failed to fetch bot info",
    });
  }
}
