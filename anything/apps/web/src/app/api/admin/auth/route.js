import { createAdminToken, verifyAdminPassword } from "@/app/api/utils/jwtAuth";

// In-memory rate limiter — keyed by IP
// { ip: { attempts: number, firstAttempt: timestamp, lockedUntil: timestamp } }
const attempts = new Map();

const MAX_ATTEMPTS = 5; // max fails before lockout
const WINDOW_MS = 15 * 60 * 1000; // 15-minute rolling window
const LOCKOUT_MS = 30 * 60 * 1000; // 30-minute lockout

function getIP(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);

  if (!rec) return { blocked: false };

  // Still in hard lockout?
  if (rec.lockedUntil && now < rec.lockedUntil) {
    const secsLeft = Math.ceil((rec.lockedUntil - now) / 1000);
    return { blocked: true, secsLeft };
  }

  // Window expired — reset
  if (now - rec.firstAttempt > WINDOW_MS) {
    attempts.delete(ip);
    return { blocked: false };
  }

  return { blocked: false };
}

function recordFailure(ip) {
  const now = Date.now();
  const rec = attempts.get(ip) || { attempts: 0, firstAttempt: now };

  rec.attempts += 1;

  if (rec.attempts >= MAX_ATTEMPTS) {
    rec.lockedUntil = now + LOCKOUT_MS;
  }

  attempts.set(ip, rec);
}

function clearRecord(ip) {
  attempts.delete(ip);
}

export async function POST(request) {
  const ip = getIP(request);

  // 1. Check if IP is locked out
  const { blocked, secsLeft } = checkRateLimit(ip);
  if (blocked) {
    const mins = Math.ceil(secsLeft / 60);
    return Response.json(
      {
        error: `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`,
      },
      { status: 429 },
    );
  }

  try {
    const { password } = await request.json();

    if (!verifyAdminPassword(password)) {
      recordFailure(ip);
      const rec = attempts.get(ip);
      const remaining = MAX_ATTEMPTS - (rec?.attempts || 0);

      if (rec?.lockedUntil) {
        return Response.json(
          { error: "Too many failed attempts. Locked out for 30 minutes." },
          { status: 429 },
        );
      }

      return Response.json(
        {
          error: `Invalid password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
        },
        { status: 401 },
      );
    }

    // Success — clear record and issue token
    clearRecord(ip);
    const token = createAdminToken();
    return Response.json({ token });
  } catch (error) {
    console.error("Admin auth error:", error);
    return Response.json({ error: "Authentication failed" }, { status: 500 });
  }
}
