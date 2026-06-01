const binCache = new Map();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bin = searchParams.get("bin");

    if (!bin || bin.length < 6) {
      return Response.json(
        { error: "Invalid BIN. Must be at least 6 digits." },
        { status: 400 },
      );
    }
    if (!/^\d+$/.test(bin)) {
      return Response.json(
        { error: "BIN must contain digits only." },
        { status: 400 },
      );
    }

    const key = bin.substring(0, 6);

    if (binCache.has(key)) {
      return Response.json({ bin: key, ...binCache.get(key), cached: true });
    }

    const res = await fetch(`https://lookup.binlist.net/${key}`, {
      headers: { "Accept-Version": "3", "User-Agent": "LuhnChecker/1.0" },
    });

    if (!res.ok) {
      return Response.json(
        { error: "BIN not found or lookup service unavailable", bin: key },
        { status: res.status },
      );
    }

    const data = await res.json();
    const result = {
      scheme: data.scheme || null,
      type: data.type || null,
      brand: data.brand || null,
      bank: data.bank?.name || null,
      bankCity: data.bank?.city || null,
      bankUrl: data.bank?.url || null,
      country: data.country?.name || null,
      countryCode: data.country?.alpha2 || null,
      emoji: data.country?.emoji || null,
      prepaid: data.prepaid || false,
    };

    binCache.set(key, result);

    return Response.json({ bin: key, ...result, cached: false });
  } catch (error) {
    console.error("BIN lookup error:", error);
    return Response.json({ error: "BIN lookup failed" }, { status: 500 });
  }
}
