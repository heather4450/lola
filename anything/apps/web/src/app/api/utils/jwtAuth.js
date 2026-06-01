import crypto from "crypto";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "[jwtAuth] AUTH_SECRET env variable is not set. Cannot sign or verify tokens.",
    );
  }
  return secret;
}

function createToken(payload, expiresIn = 86400 * 7) {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + expiresIn;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString(
    "base64url",
  );
  const secret = getAuthSecret();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const secret = getAuthSecret();
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${body}`)
      .digest("base64url");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function validateTelegramData(initData, botToken) {
  try {
    if (!botToken) return true;
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    if (!hash) return false;
    urlParams.delete("hash");
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();
    const computedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");
    return computedHash === hash;
  } catch {
    return false;
  }
}

function getUserFromToken(request) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth || !auth.startsWith("Bearer ")) return null;
    const token = auth.split(" ")[1];
    return verifyToken(token);
  } catch {
    return null;
  }
}

function createAdminToken(expiresIn = 86400) {
  return createToken({ isAdmin: true, scope: "admin" }, expiresIn);
}

function getAdminFromToken(request) {
  const payload = getUserFromToken(request);
  if (!payload || !payload.isAdmin) return null;
  return payload;
}

function verifyAdminPassword(input) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    console.error("[jwtAuth] ADMIN_PASSWORD env variable is not set.");
    return false;
  }
  if (typeof input !== "string" || input.length === 0) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export {
  createToken,
  verifyToken,
  validateTelegramData,
  getUserFromToken,
  createAdminToken,
  getAdminFromToken,
  verifyAdminPassword,
};
