import { getCorsOrigin } from './_cors.js';

export const handler = async (event) => {
  // Generate request ID for logging
  const req_id = Math.random().toString(36).substring(2, 8);
  
  const origin = event.headers.origin || "";
  const allowedOrigins = process.env.CORS_ORIGINS || "";
  const corsOrigin = getCorsOrigin(origin, allowedOrigins) || "*";
  
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

  // sanitize brand (allow empty for no-filter fallback)
  let brand = event.queryStringParameters?.brand || "";
  if (brand) {
    brand = brand.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 64);
  }

  // Log request start
  const user_agent = event.headers['user-agent'] || '';
  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || '';
  console.log(JSON.stringify({
    evt: "brand_request_start",
    req_id,
    brand,
    user_agent,
    ip
  }));

  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    Prefer: "count=exact"
  };

  // Use RPC call to join with latest_validations view
  const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/get_brand_codes_with_validations`;
  const rpcBody = {
    brand_slug: brand || null,
    limit_count: 50
  };
  
  try {
    const res = await fetch(rpcUrl, { 
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(rpcBody)
    });
    
    if (res.ok) {
      const rows = await res.json();
      const codes = rows.map(r => ({
        id: r.id,
        code: r.code,
        discount_text: r.discount_text,
        terms: r.terms,
        added_at: r.added_at,
        last_verified: r.last_verified
      }));
        
      // Log successful result
      console.log(JSON.stringify({
        evt: "brand_request_result",
        req_id,
        brand,
        count: codes.length
      }));
      
      return {
        statusCode: 200,
        headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
        body: JSON.stringify({ brand: brand || null, count: codes.length, codes })
      };
    } else {
      lastDetail = await res.text();
    }
  } catch (e) {
    lastDetail = e.message || String(e);
  }

  // Log error
  console.log(JSON.stringify({
    evt: "brand_request_error",
    req_id,
    brand,
    message: lastDetail
  }));

  return {
    statusCode: 500,
    headers: { ...cors, "Content-Type": "application/json" },
    body: JSON.stringify({ error: "Supabase error", detail: lastDetail })
  };
};