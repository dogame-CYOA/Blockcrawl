import axios from 'axios';
import { entityIdentifier } from '../../lib/entity-identifier';
import { checkRateLimit, getClientIP } from '../../lib/ratelimit';

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
  
  // Check request size limit (1MB)
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > 1024 * 1024) {
    return res.status(413).json({ error: 'Request too large' });
  }

  // Handle CORS - Restrict to your domain in production
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.vercel.app', 'https://your-domain.com'] 
    : ['http://localhost:3000'];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

  // Check rate limiting
  const clientIP = getClientIP(req);
  const rateLimitResult = await checkRateLimit(clientIP);
  
  if (!rateLimitResult.success) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((rateLimitResult.reset - new Date()) / 1000)
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
    const cleanAddress = address.trim().replace(/[^1-9A-HJ-NP-Za-km-z]/g, '');
    
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
    
    // Log request for security monitoring
    console.log('Request details:', {
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
      address: cleanAddress.substring(0, 8) + '...' // Log partial address for privacy
    });

    // Build API parameters
    const params = {
      'api-key': process.env.HELIUS_API_KEY,
      limit: 50,
      'transaction-types': 'TRANSFER,TOKEN_MINT,TOKEN_BURN,SWAP,TRANSFER_CHECKED',
    };

    // Note: Helius API doesn't support time filtering parameters
    // We'll filter transactions on the server side after fetching
    if (timeRange) {
      console.log('Time filtering will be applied after fetching data');
      console.log('Time range:', {
        start: timeRange.start,
        end: timeRange.end
      });
    }

    // Use the exact same working format as the test endpoint
    const response = await axios.get(`https://api.helius.xyz/v0/addresses/${cleanAddress}/transactions`, {
      params,
      timeout: 60000, // Increased timeout to 60 seconds
    });

    console.log('Helius API response status:', response.status);
    console.log('Response data length:', response.data?.length || 0);

    // Filter transactions by time range if provided
    let filteredTransactions = response.data || [];
    if (timeRange) {
      const startTime = new Date(timeRange.start).getTime();
      const endTime = new Date(timeRange.end).getTime();
      
      filteredTransactions = filteredTransactions.filter(tx => {
        // Convert timestamp to milliseconds if it's in seconds
        const txTime = tx.timestamp ? (tx.timestamp > 1e10 ? tx.timestamp : tx.timestamp * 1000) : 0;
        return txTime >= startTime && txTime <= endTime;
      });
      
      console.log(`Filtered ${response.data?.length || 0} transactions to ${filteredTransactions.length} within time range`);
    }

    // Process the transaction data
    const transactionData = await processTransactions(filteredTransactions, cleanAddress);

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
async function processTransactions(transactions, inputAddress) {
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

  // Debug: Log the first transaction structure
  if (transactions.length > 0) {
    console.log('Sample transaction structure:', JSON.stringify(transactions[0], null, 2));
  }

  transactions.forEach((tx, index) => {
    // Handle different transaction formats
    if (tx.tokenTransfers) {
      console.log(`Transaction ${index} has ${tx.tokenTransfers.length} token transfers`);
      tx.tokenTransfers.forEach((transfer, transferIndex) => {
        processTokenTransfer(transfer, tx, index, transferIndex, nodes, edges, inputAddress);
      });
    } else if (tx.nativeTransfers) {
      console.log(`Transaction ${index} has ${tx.nativeTransfers.length} native transfers`);
      tx.nativeTransfers.forEach((transfer, transferIndex) => {
        processNativeTransfer(transfer, tx, index, transferIndex, nodes, edges, inputAddress);
      });
          } else {
        console.log(`Transaction ${index} has no recognized transfer format. Keys:`, Object.keys(tx));
        // Try to find transfers in other possible locations
        if (tx.transfers) {
          console.log(`Transaction ${index} has transfers array:`, tx.transfers.length);
          tx.transfers.forEach((transfer, transferIndex) => {
            if (transfer.type === 'token' || transfer.mint) {
              processTokenTransfer(transfer, tx, index, transferIndex, nodes, edges, inputAddress);
            } else if (transfer.type === 'native' || transfer.amount) {
              processNativeTransfer(transfer, tx, index, transferIndex, nodes, edges, inputAddress);
            }
          });
        }
        
        // Check for other possible transfer formats
        if (tx.tokenTransfers && Array.isArray(tx.tokenTransfers)) {
          console.log(`Transaction ${index} has tokenTransfers array:`, tx.tokenTransfers.length);
          tx.tokenTransfers.forEach((transfer, transferIndex) => {
            processTokenTransfer(transfer, tx, index, transferIndex, nodes, edges, inputAddress);
          });
        }
        
        if (tx.nativeTransfers && Array.isArray(tx.nativeTransfers)) {
          console.log(`Transaction ${index} has nativeTransfers array:`, tx.nativeTransfers.length);
          tx.nativeTransfers.forEach((transfer, transferIndex) => {
            processNativeTransfer(transfer, tx, index, transferIndex, nodes, edges, inputAddress);
          });
        }
        
        // Check for account data that might contain transfer info
        if (tx.accountData) {
          console.log(`Transaction ${index} has accountData`);
          // Process account data for potential transfers
        }
      }
  });

      // Get entity information for all unique addresses
    const uniqueAddresses = Array.from(nodes.keys());
    const entityInfo = await entityIdentifier.batchResolveAddresses(uniqueAddresses);

    // Get token metadata for all unique mint addresses
    const uniqueMints = new Set();
    edges.forEach(edge => {
      if (edge.mint) {
        uniqueMints.add(edge.mint);
      }
    });
    
    const tokenMetadata = {};
    const mintPromises = Array.from(uniqueMints).map(async (mint) => {
      const metadata = await entityIdentifier.getTokenMetadata(mint);
      if (metadata) {
        tokenMetadata[mint] = metadata;
      }
    });
    await Promise.allSettled(mintPromises);

    // Enhance nodes with entity information
    const enhancedNodes = Array.from(nodes.values()).map(node => {
      const entity = entityInfo[node.id];
      if (entity) {
        return {
          ...node,
          entity: {
            name: entity.name,
            type: entity.type,
            description: entity.description,
            icon: entityIdentifier.getEntityIcon(entity.type),
            color: entityIdentifier.getEntityColor(entity.type),
            metadata: entity.metadata || null
          }
        };
      }
      return node;
    });

    // Enhance edges with token metadata
    const enhancedEdges = edges.map(edge => {
      if (edge.mint && tokenMetadata[edge.mint]) {
        return {
          ...edge,
          tokenMetadata: tokenMetadata[edge.mint]
        };
      }
      return edge;
    });

  const result = {
    nodes: enhancedNodes,
    edges: enhancedEdges,
    totalTransactions: transactions.length,
    processedAt: new Date().toISOString(),
    entityInfo: entityInfo,
    tokenMetadata: tokenMetadata
  };

  console.log('Processed result:', {
    nodes: result.nodes.length,
    edges: result.edges.length,
    entitiesFound: Object.keys(entityInfo).length
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