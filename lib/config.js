/**
 * Configuration and environment variable validation
 */

/**
 * Validate required environment variables
 */
export function validateEnvironment() {
  const required = ['HELIUS_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate API key format (basic check)
  if (process.env.HELIUS_API_KEY && !process.env.HELIUS_API_KEY.match(/^[a-f0-9-]{36}$/)) {
    console.warn('HELIUS_API_KEY format appears invalid');
  }
  
  // Validate Redis configuration if provided
  if (process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('UPSTASH_REDIS_REST_URL provided but UPSTASH_REDIS_REST_TOKEN missing');
  }
  
  if (process.env.UPSTASH_REDIS_REST_TOKEN && !process.env.UPSTASH_REDIS_REST_URL) {
    console.warn('UPSTASH_REDIS_REST_TOKEN provided but UPSTASH_REDIS_REST_URL missing');
  }
}

/**
 * Get configuration object
 */
export function getConfig() {
  return {
    helius: {
      apiKey: process.env.HELIUS_API_KEY,
      baseUrl: 'https://api.helius.xyz/v0',
      timeout: 60000,
    },
    redis: {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      enabled: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    },
    rateLimit: {
      requests: 10,
      window: '60 s',
    },
    security: {
      maxRequestSize: 1024 * 1024, // 1MB
      allowedOrigins: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.vercel.app', 'https://your-domain.com']
        : ['http://localhost:3000'],
    },
    logging: {
      enabled: process.env.NODE_ENV !== 'test',
      level: process.env.LOG_LEVEL || 'info',
    }
  };
}

// Validate environment on module load
if (typeof window === 'undefined') { // Server-side only
  try {
    validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error.message);
  }
}
