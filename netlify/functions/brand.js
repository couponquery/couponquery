const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

export const handler = async (event) => {
  const origin = event.headers.origin || "";
  const allowed = (process.env.CORS_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  const corsOrigin = allowed.includes(origin) ? origin : (allowed[0] || "*");
  const cors = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };

  try {
    const brand = event.queryStringParameters?.brand || "";
    if (!brand) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Missing brand" }) };

    const select = "id,brand,code,discount_text,terms,added_at";
    const url = `${process.env.SUPABASE_URL}/rest/v1/codes?select=${encodeURIComponent(select)}&brand=eq.${encodeURIComponent(brand)}&order=added_at.desc.nullslast`;

    const headers = {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "count=exact"
    };

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const detail = await res.text();
      return { statusCode: 502, headers: cors, body: JSON.stringify({ error: "Supabase error", detail }) };
    }
    const rows = await res.json();

    const codes = rows.map(r => ({ ...r, last_verified: null }));

    return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" }, body: JSON.stringify({ brand, count: codes.length, codes }) };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) };
  }
};