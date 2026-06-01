import sql from "@/app/api/utils/sql";

const STATIC_GATEWAYS = [
  "Luhn + BIN Check",
  "Stripe Auth",
  "Braintree Auth",
  "Shopify 10-50$",
  "PayPal Auth",
  "Square Auth",
];

// Public endpoint: returns the list of available gateways
// Disabled gateways (is_active = false in DB) are filtered out for normal users
export async function GET() {
  try {
    const rows =
      await sql`SELECT name, is_active FROM gateway_configs ORDER BY id ASC`;
    const disabledNames = new Set(
      rows.filter((r) => !r.is_active).map((r) => r.name),
    );
    const activeGateways = STATIC_GATEWAYS.filter(
      (name) => !disabledNames.has(name),
    );
    return Response.json({ gateways: activeGateways });
  } catch (err) {
    // Fallback to full list if DB unavailable
    return Response.json({ gateways: STATIC_GATEWAYS });
  }
}
