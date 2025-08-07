import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis instance (only if Redis credentials are available)
let redis;
let ratelimit;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Create rate limiter
  ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 requests per minute
    analytics: true,
  });
}

/**
 * Check if request should be rate limited
 * @param {string} identifier - Usually IP address or user ID
 * @returns {Promise<{success: boolean, limit: number, remaining: number, reset: Date}>}
 */
export async function checkRateLimit(identifier) {
  // If rate limiting is not configured, allow all requests
  if (!ratelimit) {
    console.warn('Rate limiting not configured - allowing request');
    return { success: true, limit: Infinity, remaining: Infinity, reset: new Date() };
  }

  try {
    const result = await ratelimit.limit(identifier);
    return result;
  } catch (error) {
    console.error('Rate limiting error:', error);
    // If rate limiting fails, allow the request but log the error
    return { success: true, limit: 10, remaining: 5, reset: new Date() };
  }
}

/**
 * Get client IP address from request
 * @param {NextApiRequest} req 
 * @returns {string}
 */
export function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.connection?.remoteAddress;
  return ip || 'unknown';
} 