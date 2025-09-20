/*
curl -s https://couponcanon.com/api/health | jq
curl -s https://couponcanon.com/api/brand?brand=demo | jq
*/

import { getCorsOrigin } from './_cors.js';

// Record start time on cold start
const startTime = Date.now();

export const handler = async (event) => {
  const origin = event.headers.origin || "";
  const allowedOrigins = process.env.CORS_ORIGINS || "";
  const corsOrigin = getCorsOrigin(origin, allowedOrigins);
  
  const headers = {
    "Content-Type": "application/json"
  };
  
  if (corsOrigin) {
    headers["Access-Control-Allow-Origin"] = corsOrigin;
    headers["Vary"] = "Origin";
  }
  
  const uptime = Date.now() - startTime;
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      uptime_ms: uptime,
      time: new Date().toISOString(),
      env: process.env.CONTEXT === "production" ? "production" : "preview"
    })
  };
};
