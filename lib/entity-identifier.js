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
      ],
      type: 'nft_marketplace',
      description: 'NFT Marketplace'
    });

    this.knownEntities.set('Magic Eden', {
      addresses: [
        'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K', // Magic Eden
        'MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8', // Magic Eden v2
      ],
      type: 'nft_marketplace',
      description: 'NFT Marketplace'
    });

    this.knownEntities.set('OpenSea', {
      addresses: [
        'hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk', // OpenSea
      ],
      type: 'nft_marketplace',
      description: 'NFT Marketplace'
    });

    // DEXs and Trading Platforms
    this.knownEntities.set('Jupiter', {
      addresses: [
        'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB', // Jupiter
        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', // Jupiter v6
      ],
      type: 'dex',
      description: 'DEX Aggregator'
    });

    this.knownEntities.set('Raydium', {
      addresses: [
        '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium
      ],
      type: 'dex',
      description: 'DEX'
    });

    this.knownEntities.set('Orca', {
      addresses: [
        '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Orca
      ],
      type: 'dex',
      description: 'DEX'
    });

    // Staking Platforms
    this.knownEntities.set('Marinade', {
      addresses: [
        'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD', // Marinade Finance
      ],
      type: 'staking',
      description: 'Liquid Staking'
    });

    this.knownEntities.set('Lido', {
      addresses: [
        'CrWpNEbW5YJcawrnw1V5jFWnqDpMsi6M9Vz2WrfWxK3r', // Lido
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

    this.knownEntities.set('Wormhole', {
      addresses: [
        'WormT3McKhFJ2RkiGpdY9QeS3gn9sKd3LqBKZU7wq4cn', // Wormhole
      ],
      type: 'bridge',
      description: 'Cross-chain Bridge'
    });

    // CEX Hot Wallets (partial list)
    this.knownEntities.set('Binance', {
      addresses: [
        '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1', // Binance hot wallet
      ],
      type: 'exchange',
      description: 'Centralized Exchange'
    });

    this.knownEntities.set('Coinbase', {
      addresses: [
        'Coinbase', // Coinbase hot wallet
      ],
      type: 'exchange',
      description: 'Centralized Exchange'
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
      const response = await axios.get(`https://api.solana.name/v1/resolve/${address}`, {
        timeout: 5000
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
      'labeled_address': '🏷️'
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
      'labeled_address': '#F7DC6F'
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
}

// Export singleton instance
export const entityIdentifier = new EntityIdentifier();
