import createDebug from 'debug';
import { SuperteamApiResponse, SuperteamListing } from '../types/superteam';

const debug = createDebug('bot:superteam-api');

const SUPERTEAM_API_BASE = process.env.SUPERTEAM_API_BASE || 'https://nearn.io/api';

export class SuperteamApiService {
  private static instance: SuperteamApiService;
  private lastFetchTime: Date | null = null;
  private cachedListings: SuperteamListing[] = [];

  private constructor() {}

  public static getInstance(): SuperteamApiService {
    if (!SuperteamApiService.instance) {
      SuperteamApiService.instance = new SuperteamApiService();
    }
    return SuperteamApiService.instance;
  }

  private getBaseUrl(): string {
    // Extract base URL from API base (remove /api if present)
    const url = new URL(SUPERTEAM_API_BASE);
    return `${url.protocol}//${url.host}`;
  }

  async fetchListings(projectType: string = 'bounties', categories: string[] = ['All']): Promise<SuperteamListing[]> {
    try {
      debug(`Fetching ${projectType} from Superteam API with categories: ${categories.join(', ')}`);
      
      const baseUrl = this.getBaseUrl();
      
      // If "All" is selected, use "All" category, otherwise use the first selected category
      const category = categories.includes('All') ? 'All' : categories[0] || 'All';
      
      // Build URL with query parameters
      const url = new URL(`${SUPERTEAM_API_BASE}/listings`);
      url.searchParams.set('context', 'all');
      url.searchParams.set('tab', projectType);
      url.searchParams.set('category', category);
      url.searchParams.set('status', 'open');
      url.searchParams.set('sortBy', 'Date');
      url.searchParams.set('order', 'asc');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      // Get user agent from environment or use default
       
       const response = await fetch(`${SUPERTEAM_API_BASE}/listings/?context=all&tab=all&category=All&status=open&sortBy=Date&order=asc`);
      

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limited by Superteam API. Please try again later.');
        }
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }

      const data: SuperteamApiResponse = await response.json();
      this.lastFetchTime = new Date();
      this.cachedListings = data;
      
      debug(`Fetched ${data.length} listings`);
      return data;
    } catch (error) {
      debug('Error fetching listings:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please try again later.');
        }
        if (error.message.includes('ENOTFOUND') || error.message.includes('fetch')) {
          throw new Error('Unable to reach Superteam API. Please check your internet connection.');
        }
      }
      
      throw new Error(`Failed to fetch listings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }



  getLastFetchTime(): Date | null {
    return this.lastFetchTime;
  }

  getCachedListings(): SuperteamListing[] {
    return this.cachedListings;
  }
} 