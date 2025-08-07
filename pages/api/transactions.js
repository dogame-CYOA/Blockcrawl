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

    // Build API parameters with dynamic limits based on time range
    const getLimitForTimeRange = (timeRange) => {
      if (!timeRange) return 50;
      
      const startTime = new Date(timeRange.start).getTime();
      const endTime = new Date(timeRange.end).getTime();
      const daysDiff = (endTime - startTime) / (1000 * 60 * 60 * 24);
      
      // Adjust limit based on time range
      if (daysDiff <= 1) return 100;      // 1 day or less: 100 transactions
      if (daysDiff <= 3) return 75;       // 3 days or less: 75 transactions
      if (daysDiff <= 7) return 50;       // 7 days or less: 50 transactions
      if (daysDiff <= 14) return 30;      // 14 days or less: 30 transactions
      return 20;                          // 30 days: 20 transactions
    };

    const params = {
      'api-key': process.env.HELIUS_API_KEY,
      limit: getLimitForTimeRange(timeRange),
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

    // Use the enriched transactions endpoint for better data
    const response = await axios.get(`https://api.helius.xyz/v0/addresses/${cleanAddress}/transactions`, {
      params: {
        ...params,
        'transactionTypes': ['TRANSFER', 'NFT_SALE', 'NFT_MINT', 'SWAP', 'TOKEN_MINT', 'TOKEN_BURN', 'NFT_LISTING', 'NFT_CANCEL_LISTING', 'NFT_BID', 'NFT_CANCEL_BID']
      },
      timeout: 60000, // Increased timeout to 60 seconds
    });

    console.log('Helius API response status:', response.status);
    console.log('Response data length:', response.data?.length || 0);
    console.log('Response data type:', typeof response.data);
    console.log('Response data is array:', Array.isArray(response.data));
    
    // Debug: Log a sample of the raw response
    if (response.data && response.data.length > 0) {
      console.log('Sample raw transaction:', {
        signature: response.data[0].signature,
        timestamp: response.data[0].timestamp,
        keys: Object.keys(response.data[0]),
        hasTokenTransfers: !!response.data[0].tokenTransfers,
        hasNativeTransfers: !!response.data[0].nativeTransfers,
        tokenTransfersLength: response.data[0].tokenTransfers?.length || 0,
        nativeTransfersLength: response.data[0].nativeTransfers?.length || 0
      });
    } else {
      console.log('No transactions returned from Helius API');
      console.log('Full response data:', response.data);
    }

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

          // Process the transaction data with timeout protection
    const processWithTimeout = async () => {
      return await processTransactions(filteredTransactions, cleanAddress);
    };
    
    const transactionData = await Promise.race([
      processWithTimeout(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Processing timeout')), 60000) // 60 second timeout
      )
    ]);

    // Enhance token metadata by fetching additional info for unknown tokens
    const enhancedData = await enhanceTokenMetadata(transactionData);

    console.log('Transaction data processed successfully:', {
      nodes: transactionData.nodes?.length || 0,
      edges: transactionData.edges?.length || 0
    });

    // Return success response
    return res.status(200).json({
      ...enhancedData,
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
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || error.message.includes('Processing timeout')) {
      return res.status(408).json({
        error: 'Request timeout. The processing is taking too long. Please try again.',
        suggestion: 'Try a different wallet address, reduce the time range, or try a wallet with fewer transactions.'
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

  let hasTransfers = false;
  
  transactions.forEach((tx, index) => {
    // Skip transactions with no transfers to improve performance
    const hasTokenTransfers = tx.tokenTransfers && tx.tokenTransfers.length > 0;
    const hasNativeTransfers = tx.nativeTransfers && tx.nativeTransfers.length > 0;
    
    if (!hasTokenTransfers && !hasNativeTransfers) {
      // Skip empty transactions but still log for debugging
      if (index < 5) { // Only log first 5 for performance
        console.log(`Transaction ${index} skipped - no transfers`);
      }
      return;
    }
    
    hasTransfers = true;
    
    // Handle different transaction formats
    if (hasTokenTransfers) {
      console.log(`Transaction ${index} has ${tx.tokenTransfers.length} token transfers`);
      tx.tokenTransfers.forEach((transfer, transferIndex) => {
        processTokenTransfer(transfer, tx, index, transferIndex, nodes, edges, inputAddress);
      });
    } else if (hasNativeTransfers) {
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
    }

    // Also process any accounts involved in the transaction (for broader capture)
    if (tx.accountData) {
      tx.accountData.forEach((account, accountIndex) => {
        if (account.account && account.account !== inputAddress) {
          addNodeIfNeeded(account.account, nodes, inputAddress);
        }
      });
    }
  });
  
  // Early exit if no transfers found
  if (!hasTransfers) {
    console.log('No transfers found in any transactions, returning early');
    return {
      nodes: [{
        id: inputAddress,
        label: formatAddress(inputAddress),
        type: 'input',
        size: 60,
      }],
      edges: [],
      totalTransactions: transactions.length,
      processedAt: new Date().toISOString(),
      entityInfo: {},
      tokenMetadata: {}
    };
  }

      // Get entity information for all unique addresses
    const uniqueAddresses = Array.from(nodes.keys());
    const entityInfo = await entityIdentifier.batchResolveAddresses(uniqueAddresses);

      // Get token metadata for all unique mint addresses (only if we have edges)
  const tokenMetadata = {};
  if (edges.length > 0) {
    const uniqueMints = new Set();
    edges.forEach(edge => {
      if (edge.mint) {
        uniqueMints.add(edge.mint);
      }
    });
    
    if (uniqueMints.size > 0) {
      console.log(`Fetching metadata for ${uniqueMints.size} unique tokens`);
      const mintPromises = Array.from(uniqueMints).map(async (mint) => {
        const metadata = await entityIdentifier.getTokenMetadata(mint);
        if (metadata) {
          tokenMetadata[mint] = metadata;
        }
      });
      await Promise.allSettled(mintPromises);
    }
  }

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

// Simple in-memory cache for token metadata (resets on server restart)
const tokenMetadataCache = new Map();

/**
 * Enhance token metadata by fetching additional information for unknown tokens
 */
async function enhanceTokenMetadata(transactionData) {
  const enhancedData = { ...transactionData };
  
  // Early exit if no edges to process
  if (!enhancedData.edges || enhancedData.edges.length === 0) {
    console.log('No edges to enhance, skipping token metadata fetching');
    return enhancedData;
  }
  
  const unknownTokens = new Set();
  
  // Collect all unknown token mints (excluding cached ones)
  enhancedData.edges.forEach(edge => {
    if (edge.mint && (edge.tokenSymbol === 'Unknown' || !edge.tokenSymbol)) {
      // Check if we have this token in cache
      if (!tokenMetadataCache.has(edge.mint)) {
        unknownTokens.add(edge.mint);
      } else {
        // Use cached metadata
        const cachedMetadata = tokenMetadataCache.get(edge.mint);
        edge.tokenSymbol = cachedMetadata.symbol;
        edge.tokenName = cachedMetadata.name;
        edge.tokenLogo = cachedMetadata.logo;
        edge.tokenMetadata = cachedMetadata.metadata;
      }
    }
  });

  // Fetch metadata for unknown tokens (optimized for performance)
  if (unknownTokens.size > 0) {
    console.log(`Fetching metadata for ${unknownTokens.size} unknown tokens`);
    
    // Batch fetch token metadata for better performance
    const tokenMints = Array.from(unknownTokens);
    const batchSize = 5; // Reduced batch size for faster responses
    
    for (let i = 0; i < tokenMints.length; i += batchSize) {
      const batch = tokenMints.slice(i, i + batchSize);
      
      try {
        const tokenResponse = await axios.get(`https://api.helius.xyz/v0/token-metadata`, {
          params: {
            'api-key': process.env.HELIUS_API_KEY,
            'mintAccounts': batch
          },
          timeout: 8000
        });

        if (tokenResponse.data && Array.isArray(tokenResponse.data)) {
          tokenResponse.data.forEach((tokenInfo, index) => {
            if (tokenInfo && tokenInfo.mint) {
              const symbol = tokenInfo.onChainMetadata?.metadata?.data?.symbol || 
                            tokenInfo.offChainMetadata?.symbol ||
                            tokenInfo.onChainMetadata?.metadata?.data?.name?.slice(0, 4) || // Use first 4 chars of name as fallback
                            'Unknown';
              
                             // Cache the token metadata
               const tokenName = tokenInfo.onChainMetadata?.metadata?.data?.name || 
                               tokenInfo.offChainMetadata?.name || 'Unknown';
               const tokenMetadata = {
                 decimals: tokenInfo.onChainMetadata?.metadata?.data?.decimals,
                 supply: tokenInfo.onChainMetadata?.metadata?.data?.supply,
                 collection: tokenInfo.onChainMetadata?.metadata?.data?.collection,
                 symbol: symbol,
                 name: tokenName
               };
               
               tokenMetadataCache.set(tokenInfo.mint, {
                 symbol: symbol,
                 name: tokenName,
                 logo: tokenInfo.offChainMetadata?.logoURI,
                 metadata: tokenMetadata
               });
               
               // Update all edges with this mint
               enhancedData.edges.forEach(edge => {
                 if (edge.mint === tokenInfo.mint) {
                   edge.tokenSymbol = symbol;
                   edge.tokenName = tokenName;
                   edge.tokenLogo = tokenInfo.offChainMetadata?.logoURI;
                   edge.tokenMetadata = tokenMetadata;
                 }
               });
            }
          });
        }
      } catch (error) {
        console.log(`Failed to fetch metadata for token batch:`, error.message);
        
        // Fallback: try individual tokens
        for (const mint of batch) {
          try {
            const individualResponse = await axios.get(`https://api.helius.xyz/v0/token-metadata`, {
              params: {
                'api-key': process.env.HELIUS_API_KEY,
                'mintAccounts': [mint]
              },
              timeout: 3000
            });

            if (individualResponse.data && individualResponse.data[0]) {
              const tokenInfo = individualResponse.data[0];
              const symbol = tokenInfo.onChainMetadata?.metadata?.data?.symbol || 
                            tokenInfo.offChainMetadata?.symbol ||
                            'Unknown';
              
                             const tokenName = tokenInfo.onChainMetadata?.metadata?.data?.name || 
                               tokenInfo.offChainMetadata?.name || 'Unknown';
               
               // Cache the token metadata
               tokenMetadataCache.set(mint, {
                 symbol: symbol,
                 name: tokenName,
                 logo: tokenInfo.offChainMetadata?.logoURI,
                 metadata: null
               });
               
               enhancedData.edges.forEach(edge => {
                 if (edge.mint === mint) {
                   edge.tokenSymbol = symbol;
                   edge.tokenName = tokenName;
                   edge.tokenLogo = tokenInfo.offChainMetadata?.logoURI;
                 }
               });
            }
          } catch (individualError) {
            console.log(`Failed to fetch metadata for individual token ${mint}:`, individualError.message);
          }
        }
      }
    }
  }

  return enhancedData;
}

/**
 * Process token transfers
 */
function processTokenTransfer(transfer, tx, txIndex, transferIndex, nodes, edges, inputAddress) {
  const fromAddress = transfer.fromUserAccount;
  const toAddress = transfer.toUserAccount;
  
  // Include ALL transfers in transactions where the input address is involved
  // This captures royalties, fees, and other related transfers
  const isInputInvolved = fromAddress === inputAddress || toAddress === inputAddress;
  const isInputInTransaction = tx.accountData?.some(account => account.account === inputAddress);
  
  if (isInputInvolved || isInputInTransaction) {
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
        isDirectTransfer: isInputInvolved,
        isRelatedTransfer: isInputInTransaction && !isInputInvolved,
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