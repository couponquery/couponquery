export const handler = async (event) => {
  const origin = event.headers.origin || "";
  const allow = (process.env.CORS_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  const corsOrigin = allow.includes(origin) ? origin : (allow[0] || "*");
  const cors = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  const missing = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SERVICE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY");
  if (missing.length) {
    return {
      statusCode: 500,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing environment variables", missing })
    };
  }

  // sanitize brand
  let brand = event.queryStringParameters?.brand || "";
  brand = brand.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 64);

  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    Prefer: "count=exact"
  };

  const select = "id,code,discount_text,terms,added_at";
  const order = "&order=added_at.desc.nullslast";
  const limit = "&limit=50";

  // Try candidate columns, then no filter
  const filters = [];
  if (brand) {
    filters.push(`brand=eq.${encodeURIComponent(brand)}`);
    filters.push(`brand_slug=eq.${encodeURIComponent(brand)}`);
    filters.push(`brand_name=eq.${encodeURIComponent(brand)}`);
  }
  filters.push(null); // final fallback: no filter

  let lastDetail = "";
  for (const f of filters) {
    const url = `${SUPABASE_URL}/rest/v1/codes?select=${encodeURIComponent(select)}${f ? "&" + f : ""}${order}${limit}`;
    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const rows = await res.json();
        const codes = rows.map(r => ({ ...r, last_verified: null }));
        return {
          statusCode: 200,
          headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
          body: JSON.stringify({ brand: brand || null, count: codes.length, codes })
        };
      } else {
        lastDetail = await res.text();
        // continue trying the next candidate
      }
    } catch (e) {
      lastDetail = e.message || String(e);
      // continue trying the next candidate
    }
  }

  return {
    statusCode: 500,
    headers: { ...cors, "Content-Type": "application/json" },
    body: JSON.stringify({ error: "Supabase error", detail: lastDetail })
  };
};