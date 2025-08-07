import axios from 'axios';

/**
 * Serverless function to fetch transaction data securely
 * Using the same working format as the test endpoint
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

    const { address, timeRange } = req.body;

    // Validate wallet address
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ 
        error: 'Wallet address is required and must be a string' 
      });
    }

    // Validate time range if provided
    if (timeRange && (typeof timeRange !== 'object' || !timeRange.start || !timeRange.end)) {
      return res.status(400).json({ 
        error: 'Invalid time range format. Expected object with start and end properties.' 
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

    console.log('API Key configured, making direct Helius API call...');
    console.log('Fetching transactions for address:', cleanAddress);

    // Build API parameters
    const params = {
      'api-key': process.env.HELIUS_API_KEY,
      limit: 50,
    };

    // Add time range if provided
    if (timeRange) {
      // Helius API uses 'before' for the end timestamp and 'after' for the start timestamp
      // Convert ISO strings to Unix timestamps (seconds)
      const startTimestamp = Math.floor(new Date(timeRange.start).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(timeRange.end).getTime() / 1000);
      
      // Only add time parameters if they are valid
      if (startTimestamp > 0 && endTimestamp > 0) {
        params.before = endTimestamp;
        params.after = startTimestamp;
        console.log('Time range applied:', { startTimestamp, endTimestamp });
      }
    }

    // Use the exact same working format as the test endpoint
    const response = await axios.get(`https://api.helius.xyz/v0/addresses/${cleanAddress}/transactions`, {
      params,
      timeout: 60000, // Increased timeout to 60 seconds
    });

    console.log('Helius API response status:', response.status);
    console.log('Response data length:', response.data?.length || 0);

    // Process the transaction data
    const transactionData = processTransactions(response.data || [], cleanAddress);

    console.log('Transaction data processed successfully:', {
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
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return res.status(408).json({
        error: 'Request timeout. The Helius API is taking too long to respond. Please try again.',
        suggestion: 'Try a different wallet address or reduce the time range.'
      });
    }

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

/**
 * Process raw transaction data into nodes and edges for visualization
 */
function processTransactions(transactions, inputAddress) {
  const nodes = new Map();
  const edges = [];
  
  // Add the input wallet as the central node
  nodes.set(inputAddress, {
    id: inputAddress,
    label: formatAddress(inputAddress),
    type: 'input',
    size: 60,
  });

  console.log('Processing', transactions.length, 'transactions');

  transactions.forEach((tx, index) => {
    // Handle different transaction formats
    if (tx.tokenTransfers) {
      tx.tokenTransfers.forEach((transfer, transferIndex) => {
        processTokenTransfer(transfer, tx, index, transferIndex, nodes, edges, inputAddress);
      });
    } else if (tx.nativeTransfers) {
      tx.nativeTransfers.forEach((transfer, transferIndex) => {
        processNativeTransfer(transfer, tx, index, transferIndex, nodes, edges, inputAddress);
      });
    }
  });

  const result = {
    nodes: Array.from(nodes.values()),
    edges: edges,
    totalTransactions: transactions.length,
    processedAt: new Date().toISOString(),
  };

  console.log('Processed result:', {
    nodes: result.nodes.length,
    edges: result.edges.length
  });

  return result;
}

/**
 * Process token transfers
 */
function processTokenTransfer(transfer, tx, txIndex, transferIndex, nodes, edges, inputAddress) {
  const fromAddress = transfer.fromUserAccount;
  const toAddress = transfer.toUserAccount;
  
  // Only include direct transactions
  if (fromAddress === inputAddress || toAddress === inputAddress) {
    addNodeIfNeeded(fromAddress, nodes, inputAddress);
    addNodeIfNeeded(toAddress, nodes, inputAddress);

    if (fromAddress && toAddress) {
      edges.push({
        id: `${fromAddress}-${toAddress}-${txIndex}-${transferIndex}`,
        source: fromAddress,
        target: toAddress,
        type: getTransactionType(transfer),
        amount: transfer.tokenAmount || 0,
        mint: transfer.mint,
        signature: tx.signature,
        timestamp: tx.timestamp,
        tokenSymbol: transfer.tokenSymbol || 'Unknown',
        uiAmount: transfer.uiTokenAmount?.uiAmount || transfer.tokenAmount,
        decimals: transfer.uiTokenAmount?.decimals || 0,
      });
    }
  }
}

/**
 * Process native SOL transfers
 */
function processNativeTransfer(transfer, tx, txIndex, transferIndex, nodes, edges, inputAddress) {
  const fromAddress = transfer.fromUserAccount;
  const toAddress = transfer.toUserAccount;
  
  if (fromAddress === inputAddress || toAddress === inputAddress) {
    addNodeIfNeeded(fromAddress, nodes, inputAddress);
    addNodeIfNeeded(toAddress, nodes, inputAddress);

    if (fromAddress && toAddress) {
      edges.push({
        id: `${fromAddress}-${toAddress}-${txIndex}-${transferIndex}`,
        source: fromAddress,
        target: toAddress,
        type: 'SOL',
        amount: transfer.amount || 0,
        signature: tx.signature,
        timestamp: tx.timestamp,
      });
    }
  }
}

/**
 * Add node if it doesn't exist
 */
function addNodeIfNeeded(address, nodes, inputAddress) {
  if (address && address !== inputAddress && !nodes.has(address)) {
    nodes.set(address, {
      id: address,
      label: formatAddress(address),
      type: 'wallet',
      size: 40,
    });
  }
}

/**
 * Determine transaction type based on transfer data
 */
function getTransactionType(transfer) {
  // NFTs typically have amount of 1 and specific metadata
  if (transfer.tokenAmount === 1 || transfer.uiTokenAmount?.uiAmount === 1) {
    return 'NFT';
  }
  return 'SPL_TOKEN';
}

/**
 * Format wallet address for display
 */
function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
} 