/**
 * CORS helper for Netlify functions
 * @param {string} origin - The request origin
 * @param {string} allowedList - Comma-separated list of allowed origins
 * @returns {string|null} - The origin if allowed, null otherwise
 */
export function getCorsOrigin(origin, allowedList) {
  if (!origin || !allowedList) return null;
  
  const allowed = allowedList.split(',').map(s => s.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}
