/**
 * Shared CORS header helper for Lambda responses.
 * Returns the requesting origin if it's in the allowed list,
 * so that Access-Control-Allow-Credentials works correctly.
 */

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// In development / if no env var is set, allow localhost
if (ALLOWED_ORIGINS.length === 0) {
  ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:3000');
}

function getCorsHeaders(event) {
  const requestOrigin = event?.headers?.origin || event?.headers?.Origin || '';
  const origin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0];

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': true,
  };
}

module.exports = { getCorsHeaders };
