import axios from 'axios';

const HELIUS_BASE_URL = 'https://api.helius.xyz/v0';

/**
 * Helius API client for fetching Solana transaction data
 */
export class HeliusClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: HELIUS_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch transactions for a given wallet address
   * Filters for NFT transfers and SPL token transactions
   */
  async getTransactions(address, limit = 100) {
    try {
      const response = await this.client.get(`/addresses/${address}/transactions`, {
        params: {
          api_key: this.apiKey,
          limit: Math.min(limit, 100), // Cap at 100 for performance
          'transaction-types': ['SWAP', 'NFT_SALE', 'NFT_LISTING', 'NFT_BID', 'TRANSFER'],
        },
      });

      return this.processTransactions(response.data, address);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      
      // Handle different error types
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid API key configuration.');
      } else if (error.response?.status >= 500) {
        throw new Error('Helius API service temporarily unavailable.');
      }
      
      throw new Error('Failed to fetch transaction data');
    }
  }

  /**
   * Process raw transaction data into nodes and edges for visualization
   */
  processTransactions(transactions, inputAddress) {
    const nodes = new Map();
    const edges = [];
    
    // Add the input wallet as the central node
    nodes.set(inputAddress, {
      id: inputAddress,
      label: this.formatAddress(inputAddress),
      type: 'input',
      size: 60,
    });

    transactions.forEach((tx, index) => {
      if (!tx.tokenTransfers) return;

      tx.tokenTransfers.forEach((transfer, transferIndex) => {
        const fromAddress = transfer.fromUserAccount;
        const toAddress = transfer.toUserAccount;
        
        // Only include direct transactions (separation of 1)
        if (fromAddress === inputAddress || toAddress === inputAddress) {
          // Add nodes for connected wallets
          if (fromAddress && fromAddress !== inputAddress && !nodes.has(fromAddress)) {
            nodes.set(fromAddress, {
              id: fromAddress,
              label: this.formatAddress(fromAddress),
              type: 'wallet',
              size: 40,
            });
          }
          
          if (toAddress && toAddress !== inputAddress && !nodes.has(toAddress)) {
            nodes.set(toAddress, {
              id: toAddress,
              label: this.formatAddress(toAddress),
              type: 'wallet',
              size: 40,
            });
          }

          // Create edge for the transaction
          if (fromAddress && toAddress) {
            edges.push({
              id: `${fromAddress}-${toAddress}-${index}-${transferIndex}`,
              source: fromAddress,
              target: toAddress,
              type: this.getTransactionType(transfer),
              amount: transfer.tokenAmount || 0,
              mint: transfer.mint,
              signature: tx.signature,
              timestamp: tx.timestamp,
              // Enhanced transaction details
              tokenSymbol: transfer.tokenSymbol || 'Unknown',
              uiAmount: transfer.uiTokenAmount?.uiAmount || transfer.tokenAmount,
              decimals: transfer.uiTokenAmount?.decimals || 0,
            });
          }
        }
      });
    });

    return {
      nodes: Array.from(nodes.values()),
      edges: edges,
      totalTransactions: transactions.length,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Determine transaction type based on transfer data
   */
  getTransactionType(transfer) {
    // NFTs typically have amount of 1 and specific metadata
    if (transfer.tokenAmount === 1 || transfer.uiTokenAmount?.uiAmount === 1) {
      return 'NFT';
    }
    return 'SPL_TOKEN';
  }

  /**
   * Format wallet address for display
   */
  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  /**
   * Validate Solana wallet address
   */
  static validateAddress(address) {
    if (!address || typeof address !== 'string') {
      return false;
    }
    
    // Basic Solana address validation (Base58, length 32-44 characters)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address.trim());
  }
} 