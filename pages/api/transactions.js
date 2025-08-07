import { HeliusClient } from '../../lib/helius';
import { checkRateLimit, getClientIP } from '../../lib/ratelimit';

/**
 * Serverless function to fetch transaction data securely
 * Enhanced with rate limiting and better error handling
 */
export default async function handler(req, res) {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['POST']
    });
  }

  // Rate limiting
  const clientIP = getClientIP(req);
  const rateLimit = await checkRateLimit(clientIP);
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', rateLimit.limit);
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
  res.setHeader('X-RateLimit-Reset', rateLimit.reset.getTime());

  if (!rateLimit.success) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round((rateLimit.reset.getTime() - Date.now()) / 1000),
    });
  }

  const { address } = req.body;

  // Validate input
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid input',
      message: 'Valid wallet address is required' 
    });
  }

  const trimmedAddress = address.trim();

  // Validate Solana address format
  if (!HeliusClient.validateAddress(trimmedAddress)) {
    return res.status(400).json({ 
      error: 'Invalid address format',
      message: 'Please provide a valid Solana wallet address' 
    });
  }

  // Check for API key
  if (!process.env.HELIUS_API_KEY) {
    console.error('Helius API key not configured');
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'Service temporarily unavailable' 
    });
  }

  try {
    const helius = new HeliusClient(process.env.HELIUS_API_KEY);
    const data = await helius.getTransactions(trimmedAddress);
    
    // Add metadata
    const response = {
      ...data,
      requestInfo: {
        address: trimmedAddress,
        timestamp: new Date().toISOString(),
        rateLimit: {
          remaining: rateLimit.remaining,
          reset: rateLimit.reset.getTime(),
        }
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('API Error:', {
      message: error.message,
      address: trimmedAddress,
      timestamp: new Date().toISOString(),
      ip: clientIP,
    });

    // Return appropriate error response
    if (error.message.includes('Rate limit exceeded')) {
      res.status(429).json({ 
        error: 'External API rate limit',
        message: error.message,
      });
    } else if (error.message.includes('Invalid API key')) {
      res.status(503).json({ 
        error: 'Service configuration error',
        message: 'Service temporarily unavailable',
      });
    } else {
      res.status(500).json({ 
        error: 'Transaction fetch failed',
        message: 'Unable to fetch transaction data. Please try again later.',
      });
    }
  }
} 