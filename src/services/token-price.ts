import createDebug from 'debug';

const debug = createDebug('bot:token-price');

export class TokenPriceService {
  private static instance: TokenPriceService;
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): TokenPriceService {
    if (!TokenPriceService.instance) {
      TokenPriceService.instance = new TokenPriceService();
    }
    return TokenPriceService.instance;
  }

  async getTokenPrice(token: string): Promise<number> {
    try {
      // Check cache first
      const cached = this.priceCache.get(token);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.price;
      }

      // Fetch from API
      const price = await this.fetchTokenPrice(token);
      
      // Cache the result
      this.priceCache.set(token, {
        price,
        timestamp: Date.now()
      });

      return price;
    } catch (error) {
      debug(`Error fetching price for ${token}:`, error);
      // Return fallback prices for common tokens
      return this.getFallbackPrice(token);
    }
  }

  private async fetchTokenPrice(token: string): Promise<number> {
    // Use CoinGecko API for token prices
    const tokenId = this.getTokenId(token);
    
    if (!tokenId) {
      return this.getFallbackPrice(token);
    }

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      debug(`Fetched price for ${token}:`, data);
      
      // Handle the response format: {"near":{"usd":2.85}}
      const price = data[tokenId]?.usd;
      if (price && typeof price === 'number') {
        return price;
      }
      
      return this.getFallbackPrice(token);
    } catch (error) {
      debug(`Failed to fetch price for ${token}:`, error);
      return this.getFallbackPrice(token);
    }
  }

  private getTokenId(token: string): string | null {
    const tokenMap: Record<string, string> = {
      'NEAR': 'near',
      'SOL': 'solana',
      'ETH': 'ethereum',
      'MATIC': 'matic-network',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'USD': 'usd-coin',
      'BTC': 'bitcoin',
      'AVAX': 'avalanche-2',
      'FTM': 'fantom',
      'ARB': 'arbitrum',
      'OP': 'optimism',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'AAVE': 'aave'
    };
    
    return tokenMap[token.toUpperCase()] || null;
  }

  private getFallbackPrice(token: string): number {
    const fallbackPrices: Record<string, number> = {
      'USDC': 1,
      'USDT': 1,
      'USD': 1,
      'NEAR': 2.85, // Updated based on current market price
      'SOL': 100,
      'ETH': 3000,
      'MATIC': 0.8,
      'BTC': 45000,
      'AVAX': 30,
      'FTM': 0.3,
      'ARB': 1.5,
      'OP': 2.5,
      'LINK': 15,
      'UNI': 7,
      'AAVE': 250
    };
    
    return fallbackPrices[token.toUpperCase()] || 1;
  }

  async convertToUSD(amount: number, token: string): Promise<number> {
    const price = await this.getTokenPrice(token);
    return amount * price;
  }

  // Batch convert multiple listings
  async convertListingsToUSD(listings: any[]): Promise<any[]> {
    const uniqueTokens = [...new Set(listings.map(l => l.token))];
    const pricePromises = uniqueTokens.map(token => this.getTokenPrice(token));
    const prices = await Promise.all(pricePromises);
    
    const tokenPrices = Object.fromEntries(
      uniqueTokens.map((token, index) => [token, prices[index]])
    );

    return listings.map(listing => ({
      ...listing,
      usdAmount: listing.rewardAmount * tokenPrices[listing.token]
    }));
  }
} 