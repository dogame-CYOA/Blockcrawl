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
   * Simplified version for debugging
   */
  async getTransactions(address, limit = 50) {
    try {
      console.log('Making Helius API request to:', `/addresses/${address}/transactions`);
      console.log('API Key (first 10 chars):', this.apiKey.substring(0, 10) + '...');
      
      const response = await this.client.get(`/addresses/${address}/transactions`, {
        params: {
          api_key: this.apiKey,
          limit: Math.min(limit, 50), // Reduced limit for testing
        },
      });

      console.log('Helius API response status:', response.status);
      console.log('Response data length:', response.data?.length || 0);

      return this.processTransactions(response.data || [], address);
    } catch (error) {
      console.error('Helius API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params
        }
      });
      
      // Handle different error types
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid API key configuration.');
      } else if (error.response?.status >= 500) {
        throw new Error('Helius API service temporarily unavailable.');
      }
      
      throw new Error(`Failed to fetch transaction data: ${error.message}`);
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

    console.log('Processing', transactions.length, 'transactions');

    transactions.forEach((tx, index) => {
      // Handle different transaction formats
      if (tx.tokenTransfers) {
        tx.tokenTransfers.forEach((transfer, transferIndex) => {
          this.processTokenTransfer(transfer, tx, index, transferIndex, nodes, edges, inputAddress);
        });
      } else if (tx.nativeTransfers) {
        tx.nativeTransfers.forEach((transfer, transferIndex) => {
          this.processNativeTransfer(transfer, tx, index, transferIndex, nodes, edges, inputAddress);
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
  processTokenTransfer(transfer, tx, txIndex, transferIndex, nodes, edges, inputAddress) {
    const fromAddress = transfer.fromUserAccount;
    const toAddress = transfer.toUserAccount;
    
    // Only include direct transactions
    if (fromAddress === inputAddress || toAddress === inputAddress) {
      this.addNodeIfNeeded(fromAddress, nodes, inputAddress);
      this.addNodeIfNeeded(toAddress, nodes, inputAddress);

      if (fromAddress && toAddress) {
        edges.push({
          id: `${fromAddress}-${toAddress}-${txIndex}-${transferIndex}`,
          source: fromAddress,
          target: toAddress,
          type: this.getTransactionType(transfer),
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
  processNativeTransfer(transfer, tx, txIndex, transferIndex, nodes, edges, inputAddress) {
    const fromAddress = transfer.fromUserAccount;
    const toAddress = transfer.toUserAccount;
    
    if (fromAddress === inputAddress || toAddress === inputAddress) {
      this.addNodeIfNeeded(fromAddress, nodes, inputAddress);
      this.addNodeIfNeeded(toAddress, nodes, inputAddress);

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
  addNodeIfNeeded(address, nodes, inputAddress) {
    if (address && address !== inputAddress && !nodes.has(address)) {
      nodes.set(address, {
        id: address,
        label: this.formatAddress(address),
        type: 'wallet',
        size: 40,
      });
    }
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