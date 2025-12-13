/**
 * Shared CORS utility for Edge Functions
 * Provides secure CORS headers with origin validation
 */

const ALLOWED_ORIGINS = [
  "https://www.blinno.app",
  "https://blinno.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

/**
 * Get CORS headers with origin validation
 * @param origin - The request origin header
 * @param methods - Allowed HTTP methods (default: "POST, OPTIONS")
 * @returns CORS headers object
 */
export function getCorsHeaders(
  origin?: string | null,
  methods: string = "POST, OPTIONS"
): Record<string, string> {
  // Determine allowed origin
  let allowedOrigin = ALLOWED_ORIGINS[0]; // Default to production
  
  if (origin && typeof origin === "string") {
    // Check if origin is in allowed list
    const normalizedOrigin = origin.trim().toLowerCase();
    const isAllowed = ALLOWED_ORIGINS.some(
      (allowed) => allowed.toLowerCase() === normalizedOrigin
    );
    
    if (isAllowed) {
      allowedOrigin = origin;
    }
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

/**
 * Handle CORS preflight (OPTIONS) requests
 * @param origin - The request origin header
 * @param methods - Allowed HTTP methods
 * @returns Response for OPTIONS request
 */
export function handleCorsPreflight(
  origin?: string | null,
  methods: string = "POST, OPTIONS"
): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(origin, methods),
      "Access-Control-Allow-Methods": methods,
    },
  });
}

