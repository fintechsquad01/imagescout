
/**
 * CORS headers for Supabase Edge Functions
 * 
 * These headers allow the Edge Functions to be called from any origin
 * For production, you should restrict the 'Access-Control-Allow-Origin' to your domain
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // For production, change to your domain
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, content-length, accept',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400' // 24 hours
};

/**
 * Handle CORS preflight requests
 * 
 * @returns A Response for OPTIONS requests
 */
export function handleCors(): Response | null {
  // Return early if this isn't a preflight request
  if (typeof Request === 'undefined' || typeof Response === 'undefined') {
    return null;
  }
  
  return new Response('ok', { headers: corsHeaders });
}

/**
 * Add CORS headers to a Response
 * 
 * @param response The Response to add headers to
 * @returns The Response with CORS headers
 */
export function addCorsHeaders(response: Response): Response {
  // Create a new response with the same body and status, but with CORS headers
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
  
  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  
  return newResponse;
}
