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

  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['POST']
    });
  }

  // Rate limiting
  const clientIP = getClientIP(req);
  const rateLimitResult = await checkRateLimit(clientIP);
  
  if (!rateLimitResult.success) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining
    });
  }

  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid request body. Expected JSON object.' 
      });
    }

    const { address } = req.body;

    // Validate wallet address
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ 
        error: 'Wallet address is required and must be a string' 
      });
    }

    // Clean and validate Solana address format
    const cleanAddress = address.trim();
    
    // Basic Solana address validation (44 characters, base58)
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!solanaAddressRegex.test(cleanAddress)) {
      return res.status(400).json({ 
        error: 'Invalid Solana wallet address format' 
      });
    }

    // Check if Helius API key is configured
    if (!process.env.HELIUS_API_KEY) {
      console.error('HELIUS_API_KEY not configured');
      return res.status(500).json({ 
        error: 'API configuration error. Please try again later.' 
      });
    }

    // Initialize Helius client
    const heliusClient = new HeliusClient(process.env.HELIUS_API_KEY);

    // Fetch transaction data
    const transactionData = await heliusClient.getTransactions(cleanAddress);

    // Return success response with rate limit info
    return res.status(200).json({
      ...transactionData,
      requestInfo: {
        rateLimit: {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset
        }
      }
    });

  } catch (error) {
    console.error('API Error:', error);

    // Handle specific Helius API errors
    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Helius API rate limit exceeded. Please try again later.',
        retryAfter: 60
      });
    }

    if (error.response?.status === 400) {
      return res.status(400).json({
        error: 'Invalid wallet address or API request'
      });
    }

    if (error.response?.status === 401) {
      return res.status(500).json({
        error: 'API configuration error. Please try again later.'
      });
    }

    // Generic error response
    return res.status(500).json({
      error: 'Failed to fetch transaction data. Please try again later.'
    });
  }
} 