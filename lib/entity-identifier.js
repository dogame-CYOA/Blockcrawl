import axios from 'axios';

/**
 * Entity identification service for Solana addresses
 * Provides context about known entities, exchanges, NFT marketplaces, etc.
 */
export class EntityIdentifier {
  constructor() {
    this.cache = new Map();
    this.knownEntities = new Map();
    this.initializeKnownEntities();
  }

  /**
   * Initialize known entity addresses
   */
  initializeKnownEntities() {
    // NFT Marketplaces
    this.knownEntities.set('Tensor', {
      addresses: [
        'TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN', // Tensor Swap
        'TENSORSWAP', // Tensor program
        'TSWAP', // Tensor program ID
      ],
      type: 'nft_marketplace',
      description: 'NFT Marketplace'
    });

    this.knownEntities.set('Magic Eden', {
      addresses: [
        'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K', // Magic Eden
        'MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8', // Magic Eden v2
        'MAGIC_EDEN', // Magic Eden program
      ],
      type: 'nft_marketplace',
      description: 'NFT Marketplace'
    });

    this.knownEntities.set('OpenSea', {
      addresses: [
        'hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk', // OpenSea
        'OPENSEA', // OpenSea program
      ],
      type: 'nft_marketplace',
      description: 'NFT Marketplace'
    });

    this.knownEntities.set('Solanart', {
      addresses: [
        'CJsLwbP1iu5DuUikHEJnLfANgKy6stB2uFgvBBHoyxwz', // Solanart
      ],
      type: 'nft_marketplace',
      description: 'NFT Marketplace'
    });

    this.knownEntities.set('Hyperspace', {
      addresses: [
        'HYPE', // Hyperspace program
      ],
      type: 'nft_marketplace',
      description: 'NFT Marketplace'
    });

    // DEXs and Trading Platforms
    this.knownEntities.set('Jupiter', {
      addresses: [
        'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB', // Jupiter
        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', // Jupiter v6
        'JUP', // Jupiter program
      ],
      type: 'dex',
      description: 'DEX Aggregator'
    });

    this.knownEntities.set('Raydium', {
      addresses: [
        '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium
        'RAYDIUM', // Raydium program
        '9rpQHSyFVM1dkkHFQ2TtTzPEW7DVmEyPmN8wVniqJtuC', // Raydium AMM
      ],
      type: 'dex',
      description: 'DEX'
    });

    this.knownEntities.set('Orca', {
      addresses: [
        '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Orca
        'ORCA', // Orca program
      ],
      type: 'dex',
      description: 'DEX'
    });

    this.knownEntities.set('Serum', {
      addresses: [
        '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin', // Serum
        'SERUM', // Serum program
      ],
      type: 'dex',
      description: 'DEX'
    });

    this.knownEntities.set('Meteora', {
      addresses: [
        'METEORA', // Meteora program
      ],
      type: 'dex',
      description: 'DEX'
    });

    this.knownEntities.set('Lifinity', {
      addresses: [
        'LIFINITY', // Lifinity program
      ],
      type: 'dex',
      description: 'DEX'
    });

    // Staking Platforms
    this.knownEntities.set('Marinade', {
      addresses: [
        'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD', // Marinade Finance
        'MARINADE', // Marinade program
      ],
      type: 'staking',
      description: 'Liquid Staking'
    });

    this.knownEntities.set('Lido', {
      addresses: [
        'CrWpNEbW5YJcawrnw1V5jFWnqDpMsi6M9Vz2WrfWxK3r', // Lido
        'LIDO', // Lido program
      ],
      type: 'staking',
      description: 'Liquid Staking'
    });

    this.knownEntities.set('Socean', {
      addresses: [
        'SOCEAN', // Socean program
      ],
      type: 'staking',
      description: 'Liquid Staking'
    });

    this.knownEntities.set('Jito', {
      addresses: [
        'JITO', // Jito program
      ],
      type: 'staking',
      description: 'Liquid Staking'
    });

    // Wallets and Bridges
    this.knownEntities.set('Phantom', {
      addresses: [
        'Phantom', // Phantom wallet program
      ],
      type: 'wallet',
      description: 'Wallet'
    });

    this.knownEntities.set('Solflare', {
      addresses: [
        'SOLFLARE', // Solflare program
      ],
      type: 'wallet',
      description: 'Wallet'
    });

    this.knownEntities.set('Wormhole', {
      addresses: [
        'WormT3McKhFJ2RkiGpdY9QeS3gn9sKd3LqBKZU7wq4cn', // Wormhole
        'WORMHOLE', // Wormhole program
      ],
      type: 'bridge',
      description: 'Cross-chain Bridge'
    });

    this.knownEntities.set('Portal', {
      addresses: [
        'PORTAL', // Portal bridge
      ],
      type: 'bridge',
      description: 'Cross-chain Bridge'
    });

    this.knownEntities.set('Allbridge', {
      addresses: [
        'ALLBRIDGE', // Allbridge program
      ],
      type: 'bridge',
      description: 'Cross-chain Bridge'
    });

    // CEX Hot Wallets
    this.knownEntities.set('Binance', {
      addresses: [
        '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1', // Binance hot wallet
        'BINANCE', // Binance program
      ],
      type: 'exchange',
      description: 'Centralized Exchange'
    });

    this.knownEntities.set('Coinbase', {
      addresses: [
        'COINBASE', // Coinbase program
      ],
      type: 'exchange',
      description: 'Centralized Exchange'
    });

    this.knownEntities.set('Kraken', {
      addresses: [
        'KRAKEN', // Kraken program
      ],
      type: 'exchange',
      description: 'Centralized Exchange'
    });

    this.knownEntities.set('FTX', {
      addresses: [
        'FTX', // FTX program (historical)
      ],
      type: 'exchange',
      description: 'Centralized Exchange'
    });

    // Lending Platforms
    this.knownEntities.set('Solend', {
      addresses: [
        'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo', // Solend
        'SOLEND', // Solend program
      ],
      type: 'lending',
      description: 'Lending Protocol'
    });

    this.knownEntities.set('Mango', {
      addresses: [
        'Mango', // Mango program
      ],
      type: 'lending',
      description: 'Lending Protocol'
    });

    this.knownEntities.set('Francium', {
      addresses: [
        'FRANCIUM', // Francium program
      ],
      type: 'lending',
      description: 'Lending Protocol'
    });

    // Yield Farming
    this.knownEntities.set('Tulip', {
      addresses: [
        'TULIP', // Tulip program
      ],
      type: 'yield',
      description: 'Yield Farming'
    });

    this.knownEntities.set('Saber', {
      addresses: [
        'SABER', // Saber program
      ],
      type: 'yield',
      description: 'Yield Farming'
    });

    // Gaming Platforms
    this.knownEntities.set('Star Atlas', {
      addresses: [
        'STAR_ATLAS', // Star Atlas program
      ],
      type: 'gaming',
      description: 'Gaming Platform'
    });

    this.knownEntities.set('Aurory', {
      addresses: [
        'AURORY', // Aurory program
      ],
      type: 'gaming',
      description: 'Gaming Platform'
    });

    // DeFi Protocols
    this.knownEntities.set('Anchor', {
      addresses: [
        'ANCHOR', // Anchor program
      ],
      type: 'defi',
      description: 'DeFi Protocol'
    });

    this.knownEntities.set('Pyth', {
      addresses: [
        'PYTH', // Pyth oracle
      ],
      type: 'oracle',
      description: 'Oracle Network'
    });

    this.knownEntities.set('Chainlink', {
      addresses: [
        'CHAINLINK', // Chainlink oracle
      ],
      type: 'oracle',
      description: 'Oracle Network'
    });

    // DAOs and Governance
    this.knownEntities.set('Realms', {
      addresses: [
        'REALMS', // Realms DAO
      ],
      type: 'dao',
      description: 'DAO Platform'
    });

    this.knownEntities.set('Tribeca', {
      addresses: [
        'TRIBECA', // Tribeca DAO
      ],
      type: 'dao',
      description: 'DAO Platform'
    });
  }

  /**
   * Get entity information for an address
   */
  async getEntityInfo(address) {
    if (!address) return null;

    // Check cache first
    if (this.cache.has(address)) {
      return this.cache.get(address);
    }

    // Check known entities
    const knownEntity = this.findKnownEntity(address);
    if (knownEntity) {
      this.cache.set(address, knownEntity);
      return knownEntity;
    }

    // Try to resolve SNS domain
    try {
      const snsInfo = await this.resolveSNS(address);
      if (snsInfo) {
        this.cache.set(address, snsInfo);
        return snsInfo;
      }
    } catch (error) {
      console.log('SNS resolution failed for:', address);
    }

    // Try to get Solscan label
    try {
      const solscanInfo = await this.getSolscanLabel(address);
      if (solscanInfo) {
        this.cache.set(address, solscanInfo);
        return solscanInfo;
      }
    } catch (error) {
      console.log('Solscan lookup failed for:', address);
    }

    // Try to get Birdeye token info
    try {
      const birdeyeInfo = await this.getBirdeyeTokenInfo(address);
      if (birdeyeInfo) {
        this.cache.set(address, birdeyeInfo);
        return birdeyeInfo;
      }
    } catch (error) {
      console.log('Birdeye lookup failed for:', address);
    }

    // Try to get Jupiter token info
    try {
      const jupiterInfo = await this.getJupiterTokenInfo(address);
      if (jupiterInfo) {
        this.cache.set(address, jupiterInfo);
        return jupiterInfo;
      }
    } catch (error) {
      console.log('Jupiter lookup failed for:', address);
    }

    // Return null if no entity found
    return null;
  }

  /**
   * Find known entity by address
   */
  findKnownEntity(address) {
    for (const [name, entity] of this.knownEntities) {
      if (entity.addresses.includes(address)) {
        return {
          name,
          type: entity.type,
          description: entity.description,
          source: 'known_entities'
        };
      }
    }
    return null;
  }

  /**
   * Resolve SNS domain name
   */
  async resolveSNS(address) {
    try {
      // Validate address before making request
      if (!address || typeof address !== 'string' || address.length > 50) {
        return null;
      }
      
      const response = await axios.get(`https://api.solana.name/v1/resolve/${address}`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'SolanaVisualizer/1.0'
        }
      });

      if (response.data && response.data.name) {
        return {
          name: response.data.name,
          type: 'sns_domain',
          description: `SNS Domain: ${response.data.name}`,
          source: 'sns'
        };
      }
    } catch (error) {
      // SNS resolution failed, continue to other methods
    }
    return null;
  }

  /**
   * Get Solscan label for address
   */
  async getSolscanLabel(address) {
    try {
      const response = await axios.get(`https://api.solscan.io/account?address=${address}`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SolanaVisualizer/1.0)'
        }
      });

      if (response.data && response.data.data && response.data.data.label) {
        return {
          name: response.data.data.label,
          type: 'labeled_address',
          description: `Labeled: ${response.data.data.label}`,
          source: 'solscan'
        };
      }
    } catch (error) {
      // Solscan lookup failed, continue to other methods
    }
    return null;
  }

  /**
   * Get Birdeye token information
   */
  async getBirdeyeTokenInfo(address) {
    try {
      const response = await axios.get(`https://public-api.birdeye.so/public/token_list?address=${address}`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SolanaVisualizer/1.0)'
        }
      });

      if (response.data && response.data.data && response.data.data.length > 0) {
        const token = response.data.data[0];
        return {
          name: token.symbol || token.name,
          type: 'token',
          description: `Token: ${token.name}`,
          source: 'birdeye',
          metadata: {
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            volume24h: token.volume24h,
            price: token.price
          }
        };
      }
    } catch (error) {
      // Birdeye lookup failed, continue to other methods
    }
    return null;
  }

  /**
   * Get Jupiter token information
   */
  async getJupiterTokenInfo(address) {
    try {
      const response = await axios.get(`https://token.jup.ag/all`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SolanaVisualizer/1.0)'
        }
      });

      if (response.data && response.data.tokens) {
        const token = response.data.tokens.find(t => t.address === address);
        if (token) {
          return {
            name: token.symbol,
            type: 'token',
            description: `Token: ${token.name}`,
            source: 'jupiter',
            metadata: {
              symbol: token.symbol,
              name: token.name,
              decimals: token.decimals,
              logoURI: token.logoURI
            }
          };
        }
      }
    } catch (error) {
      // Jupiter lookup failed, continue to other methods
    }
    return null;
  }

  /**
   * Get entity icon/emoji based on type
   */
  getEntityIcon(type) {
    const icons = {
      'nft_marketplace': '🖼️',
      'dex': '🔄',
      'staking': '🔒',
      'wallet': '👛',
      'bridge': '🌉',
      'exchange': '🏦',
      'sns_domain': '🌐',
      'labeled_address': '🏷️',
      'token': '🪙',
      'lending': '💰',
      'yield': '🌾',
      'gaming': '🎮',
      'defi': '🏛️',
      'oracle': '🔮',
      'dao': '🏛️'
    };
    return icons[type] || '👤';
  }

  /**
   * Get entity color based on type
   */
  getEntityColor(type) {
    const colors = {
      'nft_marketplace': '#FF6B6B',
      'dex': '#4ECDC4',
      'staking': '#45B7D1',
      'wallet': '#96CEB4',
      'bridge': '#FFEAA7',
      'exchange': '#DDA0DD',
      'sns_domain': '#98D8C8',
      'labeled_address': '#F7DC6F',
      'token': '#FFD93D',
      'lending': '#6C5CE7',
      'yield': '#00B894',
      'gaming': '#E84393',
      'defi': '#74B9FF',
      'oracle': '#A29BFE',
      'dao': '#FD79A8'
    };
    return colors[type] || '#BDC3C7';
  }

  /**
   * Batch resolve multiple addresses
   */
  async batchResolveAddresses(addresses) {
    const results = {};
    const promises = addresses.map(async (address) => {
      const entityInfo = await this.getEntityInfo(address);
      if (entityInfo) {
        results[address] = entityInfo;
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Get enhanced token metadata including project information
   */
  async getTokenMetadata(mintAddress) {
    if (!mintAddress) return null;

    try {
      // Try to get metadata from Helius (if API key is available)
      if (process.env.HELIUS_API_KEY) {
        const response = await axios.get(`https://api.helius.xyz/v0/token-metadata?api-key=${process.env.HELIUS_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            mintAccounts: [mintAddress],
            includeOffChain: true,
            disableCache: false,
          },
          timeout: 10000
        });

        if (response.data && response.data.length > 0) {
          const metadata = response.data[0];
          return {
            name: metadata.onChainMetadata?.metadata?.data?.name || metadata.offChainMetadata?.name,
            symbol: metadata.onChainMetadata?.metadata?.data?.symbol || metadata.offChainMetadata?.symbol,
            description: metadata.offChainMetadata?.description,
            image: metadata.offChainMetadata?.image,
            externalUrl: metadata.offChainMetadata?.external_url,
            attributes: metadata.offChainMetadata?.attributes,
            collection: metadata.offChainMetadata?.collection,
            decimals: metadata.onChainMetadata?.accountData?.decimals,
            supply: metadata.onChainMetadata?.accountData?.supply,
            mint: mintAddress
          };
        }
      }
    } catch (error) {
      console.log('Helius metadata lookup failed for:', mintAddress);
    }

    return null;
  }

  /**
   * Get real-time entity updates (for future use)
   */
  async getRealTimeUpdates(address) {
    // This method can be used for real-time entity updates
    // For now, it returns cached data, but can be extended for WebSocket connections
    return this.cache.get(address) || null;
  }

  /**
   * Clear cache for specific address or all addresses
   */
  clearCache(address = null) {
    if (address) {
      this.cache.delete(address);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const entityIdentifier = new EntityIdentifier();
