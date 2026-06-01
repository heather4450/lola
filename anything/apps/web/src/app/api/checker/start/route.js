import sql from "@/app/api/utils/sql";
import { getUserFromToken } from "@/app/api/utils/jwtAuth";
import { luhnCheck } from "@/app/api/utils/luhn";

// ──────────────────────────────────────────────
// Gateway-specific dummy response codes
// ──────────────────────────────────────────────
const GATEWAYS = {
  "Luhn + BIN Check": {
    approvalRate: 1.0,
    approved: { code: "LUHN_VALID", message: "Luhn checksum passed" },
    declined: [{ code: "LUHN_INVALID", message: "Luhn checksum failed" }],
  },
  "Stripe Auth": {
    approvalRate: 0.28,
    approved: { code: "charge.succeeded", message: "Charge authorized ✓" },
    declined: [
      { code: "card_declined", message: "Your card was declined" },
      {
        code: "insufficient_funds",
        message: "Your card has insufficient funds",
      },
      { code: "do_not_honor", message: "Bank declined — Do not honor" },
      { code: "incorrect_cvc", message: "CVC check failed" },
      { code: "expired_card", message: "Your card has expired" },
      { code: "lost_card", message: "Card reported lost by issuer" },
      { code: "stolen_card", message: "Card reported stolen by issuer" },
      { code: "fraudulent", message: "Suspected fraudulent card" },
      {
        code: "card_velocity_exceeded",
        message: "Card velocity limit exceeded",
      },
      {
        code: "authentication_required",
        message: "3DS authentication required",
      },
      {
        code: "card_not_supported",
        message: "Card not supported for this transaction",
      },
      {
        code: "processing_error",
        message: "An error occurred while processing",
      },
    ],
  },
  "Braintree Auth": {
    approvalRate: 0.22,
    approved: { code: "1000", message: "Approved" },
    declined: [
      { code: "2000", message: "Do Not Honor" },
      { code: "2001", message: "Insufficient Funds" },
      { code: "2002", message: "Limit Exceeded" },
      { code: "2003", message: "Cardholder Activity Limit Exceeded" },
      { code: "2004", message: "Expired Card" },
      { code: "2005", message: "Invalid Credit Card Number" },
      { code: "2006", message: "Invalid Expiration Date" },
      { code: "2007", message: "No Account / Non-Existent" },
      { code: "2009", message: "No Such Issuer" },
      { code: "2010", message: "Card Issuer Declined CVV" },
      { code: "2012", message: "Declined — Application Not Supported" },
      { code: "2014", message: "Declined — Call Issuer" },
      { code: "2015", message: "Not Allowed — Transaction Not Permitted" },
      { code: "2016", message: "Duplicate Transaction" },
      { code: "2038", message: "Declined — Processor Declined" },
      { code: "2046", message: "Declined — Bank/Issuer" },
      { code: "2057", message: "Issuer or Cardholder Has Put a Restriction" },
      { code: "2075", message: "Declined — AVS Mismatch" },
    ],
  },
  "Shopify 10-50$": {
    approvalRate: 0.18,
    approved: {
      code: "payment_authorized",
      message: "Payment authorized $10–$50",
    },
    declined: [
      { code: "card_declined", message: "Card declined by issuer" },
      { code: "insufficient_funds", message: "Insufficient funds on card" },
      { code: "avs_check_failed", message: "Address verification failed" },
      { code: "cvv_check_failed", message: "CVV/CVC check failed" },
      { code: "expired_card", message: "Card expiry date is invalid" },
      { code: "fraud_risk", message: "Transaction flagged as high risk" },
      { code: "velocity_exceeded", message: "Card velocity limit exceeded" },
      { code: "invalid_card", message: "Card number is invalid" },
      {
        code: "gateway_rejected_avs",
        message: "Gateway rejected — AVS failure",
      },
      {
        code: "gateway_rejected_cvv",
        message: "Gateway rejected — CVV failure",
      },
    ],
  },
  "PayPal Auth": {
    approvalRate: 0.24,
    approved: { code: "COMPLETED", message: "Transaction completed" },
    declined: [
      { code: "INSTRUMENT_DECLINED", message: "Payment instrument declined" },
      {
        code: "PAYER_CANNOT_PAY",
        message: "Payer cannot pay for this transaction",
      },
      { code: "TRANSACTION_REFUSED", message: "Transaction refused by PayPal" },
      {
        code: "PAYER_ACCOUNT_RESTRICTED",
        message: "Payer account is restricted",
      },
      { code: "INSUFFICIENT_FUNDS", message: "Insufficient funds in account" },
      { code: "CARD_CLOSED", message: "Card account is closed" },
      { code: "CREDIT_CARD_REFUSED", message: "Credit card was refused" },
      {
        code: "MAX_PAYMENT_ATTEMPTS_EXCEEDED",
        message: "Maximum payment attempts exceeded",
      },
      { code: "REDIRECT_REQUIRED", message: "3DS redirect required" },
      { code: "CARD_EXPIRED", message: "Credit card has expired" },
      {
        code: "BILLING_ADDRESS_INVALID",
        message: "Billing address could not be verified",
      },
    ],
  },
  "Square Auth": {
    approvalRate: 0.2,
    approved: { code: "APPROVED", message: "Transaction approved" },
    declined: [
      { code: "CARD_DECLINED", message: "Card was declined" },
      { code: "VERIFY_CVV_FAILURE", message: "CVV verification failed" },
      { code: "VERIFY_AVS_FAILURE", message: "AVS verification failed" },
      { code: "CARD_EXPIRED", message: "Card has expired" },
      { code: "INVALID_ACCOUNT", message: "Card account is invalid" },
      { code: "CARD_NOT_SUPPORTED", message: "Card type not supported" },
      { code: "CVV_FAILURE", message: "CVV check failed" },
      {
        code: "ADDRESS_VERIFICATION_FAILURE",
        message: "Address verification failed",
      },
      {
        code: "CARDHOLDER_INSUFFICIENT_PERMISSIONS",
        message: "Cardholder has insufficient permissions",
      },
      { code: "INVALID_PIN", message: "Invalid PIN entered" },
      { code: "TRANSACTION_LIMIT", message: "Transaction exceeds card limit" },
      { code: "VOICE_FAILURE", message: "Voice authorisation required" },
      { code: "PAN_FAILURE", message: "Primary account number invalid" },
      { code: "EXPIRY_FAILURE", message: "Expiry date invalid" },
      {
        code: "CARD_DECLINED_CALL_ISSUER",
        message: "Card declined — call issuer",
      },
    ],
  },
};

// Simulate the gateway — luhn fail always declines, luhn pass goes through approval rate
function simulateGateway(gatewayName, luhnPassed) {
  const gw = GATEWAYS[gatewayName] || GATEWAYS["Luhn + BIN Check"];
  if (!luhnPassed) {
    const d = gw.declined[Math.floor(Math.random() * gw.declined.length)];
    return { approved: false, code: d.code, message: d.message };
  }
  // Roll against the gateway's approval rate
  if (Math.random() < gw.approvalRate) {
    return {
      approved: true,
      code: gw.approved.code,
      message: gw.approved.message,
    };
  }
  const d = gw.declined[Math.floor(Math.random() * gw.declined.length)];
  return { approved: false, code: d.code, message: d.message };
}
// ──────────────────────────────────────────────

const binCache = new Map();

async function lookupBIN(bin) {
  if (binCache.has(bin)) return binCache.get(bin);
  try {
    const res = await fetch(`https://lookup.binlist.net/${bin}`, {
      headers: { "Accept-Version": "3", "User-Agent": "LuhnChecker/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = {
      scheme: data.scheme || "unknown",
      type: data.type || "unknown",
      brand: data.brand || "unknown",
      bank: data.bank?.name || "Unknown Bank",
      country: data.country?.name || "Unknown",
      emoji: data.country?.emoji || "🌍",
      prepaid: data.prepaid || false,
    };
    binCache.set(bin, result);
    return result;
  } catch {
    return null;
  }
}

async function sendTelegramHit(chatId, cardLine, binInfo) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !chatId) return;
  const parts = cardLine.split("|");
  const number = parts[0] || "";
  const mm = parts[1] || "??";
  const yy = parts[2] || "??";
  const cvv = parts[3] || "???";
  const message = [
    "✅ <b>APPROVED</b>",
    "",
    `💳 <code>${number}|${mm}|${yy}|${cvv}</code>`,
    "",
    `🏦 Bank: <b>${binInfo?.bank || "N/A"}</b>`,
    `🌍 Country: ${binInfo?.emoji || ""} ${binInfo?.country || "N/A"}`,
    `💎 Type: ${binInfo?.type || "N/A"}`,
    `🎯 Scheme: ${binInfo?.scheme || "N/A"}`,
    binInfo?.prepaid ? "💰 Prepaid: Yes" : null,
    "",
    `⏱ ${new Date().toUTCString()}`,
    "━━━━━━━━━━━━━━",
    "🤖 BIN Checker Bot",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      },
    );
  } catch (err) {
    console.error("Telegram send error:", err);
  }
}

async function getGatewayCost(gatewayName) {
  // Default: 1 credit per check regardless of result
  const defaults = { cost_approved: 1, cost_declined: 1 };
  if (!gatewayName) return defaults;
  try {
    const rows = await sql`
      SELECT cost_approved, cost_declined
      FROM gateway_configs
      WHERE name = ${gatewayName} AND is_active = true
      LIMIT 1
    `;
    if (rows[0])
      return {
        cost_approved: rows[0].cost_approved,
        cost_declined: rows[0].cost_declined,
      };
  } catch {}
  return defaults;
}

/** Check if a gateway is explicitly disabled in DB (null = not configured = allowed) */
async function isGatewayDisabled(gatewayName) {
  try {
    const rows = await sql`
      SELECT is_active FROM gateway_configs WHERE name = ${gatewayName} LIMIT 1
    `;
    if (rows[0] && !rows[0].is_active) return true;
  } catch {}
  return false;
}

export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    const body = await request.json();
    const { lines, gateway, skipLuhn, skipBin } = body;
    const gatewayName = gateway || "Luhn + BIN Check";

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return Response.json({ error: "No lines provided." }, { status: 400 });
    }

    const batch = lines.slice(0, 500);

    // ── Gateway access control: block disabled gateways for non-admins ──
    const isAdminUser = !!user?.isAdmin;
    if (!isAdminUser && gatewayName !== "Luhn + BIN Check") {
      const disabled = await isGatewayDisabled(gatewayName);
      if (disabled) {
        return Response.json(
          {
            error:
              "This gateway is currently disabled. Please select another gateway.",
          },
          { status: 403 },
        );
      }
    }

    // Look up gateway credit costs
    const { cost_approved, cost_declined } = await getGatewayCost(gateway);

    // Check user balance upfront
    let telegramId = null;
    let notifyHits = true;
    if (user) {
      const userResult = await sql`
        SELECT telegram_id, notification_preferences, credits, is_banned
        FROM users WHERE id = ${user.userId}
      `;
      if (!userResult[0])
        return Response.json({ error: "User not found" }, { status: 404 });
      if (userResult[0].is_banned)
        return Response.json({ error: "Account is banned." }, { status: 403 });

      // Estimate max cost (worst case: all approved)
      const maxCost = batch.length * Math.max(cost_approved, cost_declined);
      if (userResult[0].credits < Math.min(maxCost, batch.length)) {
        return Response.json(
          { error: "Insufficient credits." },
          { status: 403 },
        );
      }

      telegramId = userResult[0].telegram_id;
      const prefs = userResult[0].notification_preferences || {};
      notifyHits = prefs.hits !== false;
    }

    const results = [];
    let good = 0;
    let bad = 0;
    let binLookupCount = 0;
    let totalCreditsUsed = 0;

    for (const line of batch) {
      const parts = line.trim().split("|");
      if (parts.length < 1) continue;
      const number = parts[0].trim();
      // If skipLuhn is true, bypass Luhn check and treat as valid
      const luhnPassed = skipLuhn ? true : luhnCheck(number);
      const bin = number.substring(0, 6);

      // Simulate the selected gateway (handles both luhn fail + approval rate)
      const gwResult = simulateGateway(gatewayName, luhnPassed);

      let binInfo = null;
      // Only do BIN lookup if skipBin is false (default)
      if (gwResult.approved && !skipBin && binLookupCount < 20) {
        binInfo = await lookupBIN(bin);
        binLookupCount++;
        if (telegramId && notifyHits) {
          sendTelegramHit(telegramId, line, binInfo);
        }
        good++;
        totalCreditsUsed += cost_approved;
      } else if (gwResult.approved) {
        good++;
        totalCreditsUsed += cost_approved;
      } else {
        bad++;
        totalCreditsUsed += cost_declined;
      }

      results.push({
        line,
        number,
        bin,
        status: gwResult.approved ? "good" : "bad",
        luhnValid: luhnPassed,
        binInfo,
        gateway: gatewayName,
        gatewayCode: gwResult.code,
        gatewayMessage: gwResult.message,
        timestamp: new Date().toISOString(),
      });
    }

    if (user && totalCreditsUsed > 0) {
      await sql`
        UPDATE users
        SET credits = GREATEST(0, credits - ${totalCreditsUsed})
        WHERE id = ${user.userId}
      `;
      await sql`
        INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
        VALUES (
          ${user.userId},
          ${-totalCreditsUsed},
          'checker',
          ${`Checked ${results.length} cards via ${gateway || "Luhn + BIN Check"} (${good} approved, ${bad} declined)`}
        )
      `;
    }

    if (user) {
      await sql`
        INSERT INTO checker_logs (user_id, session_id, lines_checked, lines_good, lines_bad, credits_used)
        VALUES (
          ${user.userId},
          ${Date.now().toString()},
          ${results.length},
          ${good},
          ${bad},
          ${totalCreditsUsed}
        )
      `;
      if (good > 0) {
        await sql`UPDATE users SET total_hits = COALESCE(total_hits, 0) + ${good} WHERE id = ${user.userId}`;
      }
    }

    return Response.json({
      results,
      stats: {
        total: results.length,
        good,
        bad,
        creditsUsed: totalCreditsUsed,
        cost_approved,
        cost_declined,
      },
    });
  } catch (error) {
    console.error("Checker error:", error);
    return Response.json({ error: "Checker failed" }, { status: 500 });
  }
}
