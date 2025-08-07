import { HeliusClient } from '../../lib/helius';

/**
 * Serverless function to fetch transaction data securely
 * Simplified version for debugging
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

    console.log('API Key configured, initializing Helius client...');

    // Initialize Helius client
    const heliusClient = new HeliusClient(process.env.HELIUS_API_KEY);

    console.log('Fetching transactions for address:', cleanAddress);

    // Fetch transaction data
    const transactionData = await heliusClient.getTransactions(cleanAddress);

    console.log('Transaction data fetched successfully:', {
      nodes: transactionData.nodes?.length || 0,
      edges: transactionData.edges?.length || 0
    });

    // Return success response
    return res.status(200).json({
      ...transactionData,
      requestInfo: {
        address: cleanAddress,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('API Error Details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });

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

    // Generic error response with more details for debugging
    return res.status(500).json({
      error: 'Failed to fetch transaction data. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 