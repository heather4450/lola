/**
 * One-click webhook registration endpoint.
 * Protected by ADMIN_PASSWORD — no JWT needed.
 * Visit: GET /api/bot/register?key=YOUR_ADMIN_PASSWORD
 * This is safe to expose because:
 *   1. It requires knowledge of ADMIN_PASSWORD
 *   2. It only registers the webhook — it cannot read or modify data
 *   3. The bot token is never returned in the response
 */

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  const adminPassword = process.env.ADMIN_PASSWORD;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_CREATE_APP_URL;

  // Auth check
  if (!adminPassword) {
    return html("❌ ADMIN_PASSWORD is not set in secrets.", false);
  }
  if (!key || key !== adminPassword) {
    return html(
      "❌ Wrong key. Visit this URL with ?key=YOUR_ADMIN_PASSWORD",
      false,
    );
  }

  // Env checks
  const missing = [];
  if (!botToken) missing.push("TELEGRAM_BOT_TOKEN");
  if (!webhookSecret) missing.push("TELEGRAM_WEBHOOK_SECRET");
  if (!appUrl) missing.push("NEXT_PUBLIC_CREATE_APP_URL");

  if (missing.length > 0) {
    return html(
      `❌ Missing secrets: ${missing.join(", ")}\n\nAdd them in the 🔒 Secrets panel, then Publish, then try again.`,
      false,
    );
  }

  // Validate secret_token contains only allowed characters
  const allowedCharactersRegex = /^[A-Za-z0-9_-]+$/;
  if (!allowedCharactersRegex.test(webhookSecret)) {
    console.error(`[bot/register] Invalid secret_token characters:`, webhookSecret);
    return html(
      `❌ TELEGRAM_WEBHOOK_SECRET contains invalid characters!\n\nAllowed: A-Z, a-z, 0-9, underscore (_), dash (-)\n\nCurrent value: "${webhookSecret}"\n\nUpdate it in the Secrets panel and try again.`,
      false,
    );
  }

  const webhookUrl = `${appUrl}/api/bot/webhook`;

  try {
    // 1. Get bot info
    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const meData = await meRes.json();
    if (!meData.ok) {
      return html(
        `❌ Bot token rejected by Telegram: "${meData.description}"\n\nRevoke your old token with @BotFather and save the new one as TELEGRAM_BOT_TOKEN.`,
        false,
      );
    }

    // 2. Register webhook
    const payloadBody = JSON.stringify({
      url: webhookUrl,
      secret_token: webhookSecret,
      allowed_updates: ["message", "edited_message"],
      drop_pending_updates: true,
    });

    console.log("[bot/register] Sending webhook payload:", {
      url: webhookUrl,
      secret_token: webhookSecret,
      secret_token_length: webhookSecret.length,
      secret_token_chars: webhookSecret.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(', '),
    });

    const setRes = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payloadBody,
      },
    );
    const setData = await setRes.json();
    
    console.log("[bot/register] Telegram setWebhook response:", setData);
    
    if (!setData.ok) {
      return html(`❌ Telegram error: ${setData.description}`, false);
    }

    // 3. Set public commands
    await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          { command: "start", description: "Open the Mini App" },
          { command: "help", description: "Show available commands" },
        ],
      }),
    });

    // 4. Confirm webhook info
    const infoRes = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`,
    );
    const infoData = await infoRes.json();

    return html(
      `✅ Webhook registered successfully!\n\n` +
        `🤖 Bot: @${meData.result.username} (${meData.result.first_name})\n` +
        `🔗 Webhook URL: ${webhookUrl}\n` +
        `📬 Pending updates: ${infoData.result?.pending_update_count ?? 0}\n\n` +
        `Now send /start to @${meData.result.username} in Telegram — it should reply! 🎉`,
      true,
    );
  } catch (err) {
    console.error("[bot/register] error:", err);
    return html(`❌ Unexpected error: ${err.message}`, false);
  }
}

function html(message, ok) {
  const color = ok ? "#30D158" : "#FF453A";
  const bg = ok ? "#0a1f0e" : "#1f0a0a";
  const icon = ok ? "✅" : "❌";
  const body = message.replace(/\n/g, "<br>");

  return new Response(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Bot Setup — BIN Checker</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      background: #0B0B0F;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: ${bg};
      border: 1.5px solid ${color}40;
      border-radius: 20px;
      padding: 32px 28px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 8px 40px ${color}20;
    }
    h1 { font-size: 20px; color: ${color}; margin-bottom: 16px; }
    p  { font-size: 14px; color: rgba(255,255,255,0.75); line-height: 1.7; }
    code {
      background: rgba(255,255,255,0.08);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      color: #4DA3FF;
    }
    .back {
      display: inline-block;
      margin-top: 20px;
      font-size: 12px;
      color: rgba(255,255,255,0.35);
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${icon} Bot Setup</h1>
    <p>${body}</p>
    <a class="back" href="/">← Back to app</a>
  </div>
</body>
</html>`,
    {
      status: ok ? 200 : 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}
