import createDebug from 'debug';
import { SuperteamListing, UserPreferences } from '../types/superteam';
import { TokenPriceService } from './token-price';

const debug = createDebug('bot:database');

// Skill to category mapping
const skillCategoryMap: Record<string, string> = {
  // DEV category
  'FRONTEND': 'DEV',
  'BACKEND': 'DEV', 
  'BLOCKCHAIN': 'DEV',
  'MOBILE': 'DEV',
  'DEV': 'DEV',
  
  // DESIGN category
  'UI/UX': 'DESIGN',
  'GRAPHIC': 'DESIGN',
  'GAME': 'DESIGN',
  'DESIGN' :'DESIGN',
  
  // CONTENT category
  'RESEARCH': 'CONTENT',
  'SOCIAL': 'CONTENT',
  'CONTENT': 'CONTENT',
  
  // GROWTH category
  'BUSINESS_DEVELOPMENT': 'GROWTH',
  'MARKETING': 'GROWTH',
  'GROWTH': 'GROWTH',
  'DEVELOPMENT': 'DEV',
  
  // COMMUNITY category
  'COMMUNITY_MANAGER': 'COMMUNITY',
  'COMMUNITY': 'COMMUNITY',
  'SOCIAL_MODERATOR': 'COMMUNITY',
};

// Function to map skills to category
function mapSkillsToCategory(skills: any[]): string {
  for (const skillObj of skills) {
    if (skillObj.skills) {
      const category = skillCategoryMap[skillObj.skills.toUpperCase()];
      if (category) {
        return category;
      }
    }
  }
  return 'OTHER'; // Default category if no skill matches
}

// Temporary in-memory storage for development
const inMemoryStorage = {
  listings: new Map<string, any>(),
  userPreferences: new Map<number, UserPreferences>(),
  notificationLogs: [] as any[],
  systemConfig: new Map<string, string>(),
};

export class DatabaseService {
  private static instance: DatabaseService;
  private prisma: any = null;
  private usePrisma = false;
  private nextListingId: number = 1;

  private constructor() {
    // Try to initialize Prisma, fall back to in-memory if not available
    try {
      const { PrismaClient } = require('@prisma/client');
      this.prisma = new PrismaClient();
      this.usePrisma = true;
      debug('Prisma client initialized successfully');
    } catch (error) {
      debug('Prisma not available, using in-memory storage:', error);
      this.usePrisma = false;
    }
  }

  private generateUniqueListingId(): number {
    return this.nextListingId++;
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Listing operations
  async syncListings(listings: SuperteamListing[]): Promise<number> {
    try {
      debug(`Syncing ${listings.length} listings to ${this.usePrisma ? 'database' : 'memory'}`);
      
      let syncedCount = 0;
      
      for (const listing of listings) {
        try {
          // Fetch additional data from detail page
          let description = '';
          let skills: any[] = [];
          
          if (listing.sequentialId && listing.sponsor?.slug) {
            try {
              const detailUrl = `${process.env.SERVER_URL || 'https://nearn.io'}/_next/data/${process.env.NEXT_DATA_HASH}/${listing.sponsor.slug}/${listing.sequentialId}.json`;
              const detailResponse = await fetch(detailUrl);
              
              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                if (detailData.pageProps?.bounty) {
                  description = detailData.pageProps.bounty.description || '';
                  skills = detailData.pageProps.bounty.skills || [];
                }
              }
            } catch (error) {
              debug(`Error fetching detail data for listing ${listing.slug}:`, error);
            }
          }
          
                      const listingData = {
              title: listing.title,
              rewardAmount: listing.rewardAmount,
              token: listing.token,
              deadline: new Date(listing.deadline),
              type: listing.type,
              status: listing.status,
              isWinnersAnnounced: listing.isWinnersAnnounced,
              isFeatured: listing.isFeatured,
              compensationType: listing.compensationType,
              minRewardAsk: listing.minRewardAsk,
              maxRewardAsk: listing.maxRewardAsk,
              winnersAnnouncedAt: listing.winnersAnnouncedAt ? new Date(listing.winnersAnnouncedAt) : null,
              commentsCount: listing._count.Comments,
              submissionCount: listing._count.Submission,
              sequentialId: listing.sequentialId,
              description,
              skills,
              mappedCategory: mapSkillsToCategory(skills),
              sponsorName: listing.sponsor.name,
              sponsorSlug: listing.sponsor.slug,
              sponsorLogo: listing.sponsor.logo,
              sponsorIsVerified: listing.sponsor.isVerified,
              sponsorSt: listing.sponsor.st,
              syncedAt: new Date(),
            };
            debug(listingData)
          if (this.usePrisma && this.prisma) {
            // Generate unique ID independent of sequentialId
            const uniqueId = this.generateUniqueListingId();
            
            await this.prisma.listing.upsert({
              where: { slug: listing.slug },
              update: listingData,
              create: {
                id: uniqueId,
                slug: listing.slug,
                ...listingData,
              },
            });
          } else {
            // In-memory storage using unique ID as key
            const uniqueId = this.generateUniqueListingId();
            inMemoryStorage.listings.set(uniqueId.toString(), {
              ...listing,
              ...listingData,
            });
          }
          syncedCount++;
        } catch (error) {
          debug(`Error syncing listing ${listing.slug}:`, error);
        }
      }
      
      debug(`Successfully synced ${syncedCount} listings`);
      return syncedCount;
    } catch (error) {
      debug('Error syncing listings:', error);
      throw error;
    }
  }

  async getNewListings(sinceDate: Date): Promise<any[]> {
    try {
      if (this.usePrisma && this.prisma) {
        const listings = await this.prisma.listing.findMany({
          where: {
            syncedAt: {
              gte: sinceDate,
            },
          },
          orderBy: {
            syncedAt: 'desc',
          },
        });
        return listings;
      } else {
        // In-memory storage
        const listings = Array.from(inMemoryStorage.listings.values())
          .filter((listing: any) => listing.syncedAt >= sinceDate)
          .sort((a: any, b: any) => b.syncedAt - a.syncedAt);
        return listings;
      }
    } catch (error) {
      debug('Error getting new listings:', error);
      return [];
    }
  }

  async getListingsByFilters(
    projectType: string,
    categories: string[],
    minBounty: number,
    maxBounty?: number,
    sinceDate?: Date
  ): Promise<any[]> {
    try {
      if (this.usePrisma && this.prisma) {
        // Build where clause for database filtering
        const whereClause: any = {};
        
        // Only filter by project type if it's not "all"
        if (projectType !== 'all') {
          whereClause.type = projectType;
        }

        // Add date filter if specified
        if (sinceDate) {
          whereClause.syncedAt = {
            gte: sinceDate,
          };
        }

        // Handle category filtering
        // If "All" is selected, don't filter by category
        // If specific categories are selected, filter by mappedCategory
        if (categories.length > 0 && !categories.includes('All')) {
          whereClause.mappedCategory = {
            in: categories,
          };
        }

        // Get all listings that match the basic filters (type, category, date)
        const listings = await this.prisma.listing.findMany({
          where: whereClause,
          orderBy: {
            syncedAt: 'desc',
          },
        });

        // Convert listings to USD and filter by bounty range
        const tokenPriceService = TokenPriceService.getInstance();
        const listingsWithUSD = await tokenPriceService.convertListingsToUSD(listings);
        
        const filteredListings = listingsWithUSD.filter((listing: any) => {
          // Filter by bounty range using USD amount
          if (listing.usdAmount < minBounty) return false;
          if (maxBounty && listing.usdAmount > maxBounty) return false;
          
          return true;
        });

        return filteredListings;
      } else {
        // In-memory storage fallback
        const allListings = Array.from(inMemoryStorage.listings.values());

        // Filter listings in memory
        const filteredListings = allListings.filter((listing: any) => {
          // Filter by project type (skip if "all")
          if (projectType !== 'all' && listing.type !== projectType) return false;
          
          // Filter by categories (if specified and listing has mapped category)
          // If "All" is selected, don't filter by category
          if (categories.length > 0 && !categories.includes('All') && listing.mappedCategory) {
            if (!categories.includes(listing.mappedCategory)) return false;
          }
          
          // Filter by date if specified
          if (sinceDate && listing.syncedAt < sinceDate) return false;
          
          return true;
        });

        // Convert to USD and filter by bounty range
        const tokenPriceService = TokenPriceService.getInstance();
        const listingsWithUSD = await tokenPriceService.convertListingsToUSD(filteredListings);
        
        return listingsWithUSD.filter((listing: any) => {
          // Filter by bounty range using USD amount
          if (listing.usdAmount < minBounty) return false;
          if (maxBounty && listing.usdAmount > maxBounty) return false;
          
          return true;
        });

        return filteredListings;
      }
    } catch (error) {
      debug('Error getting listings by filters:', error);
      return [];
    }
  }

  // User preference operations
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      if (this.usePrisma && this.prisma) {
        await this.prisma.userPreference.upsert({
          where: { userId: BigInt(preferences.userId) },
          update: {
            chatId: BigInt(preferences.chatId),
            categories: preferences.categories,
            minBounty: preferences.minBounty,
            maxBounty: preferences.maxBounty,
            projectType: preferences.projectType,
            isActive: preferences.isActive,
            updatedAt: new Date(),
          },
          create: {
            userId: BigInt(preferences.userId),
            chatId: BigInt(preferences.chatId),
            categories: preferences.categories,
            minBounty: preferences.minBounty,
            maxBounty: preferences.maxBounty,
            projectType: preferences.projectType,
            isActive: preferences.isActive,
          },
        });
      } else {
        // In-memory storage
        inMemoryStorage.userPreferences.set(preferences.userId, {
          ...preferences,
          updatedAt: new Date(),
        });
      }
      
      debug(`Saved user preferences for user ${preferences.userId}`);
    } catch (error) {
      debug('Error saving user preferences:', error);
      throw error;
    }
  }

  async getUserPreferences(userId: number): Promise<UserPreferences | null> {
    try {
      if (this.usePrisma && this.prisma) {
        const preference = await this.prisma.userPreference.findUnique({
          where: { userId: BigInt(userId) },
        });

        if (!preference) {
          return null;
        }

        return {
          userId: Number(preference.userId),
          chatId: Number(preference.chatId),
          categories: preference.categories,
          minBounty: preference.minBounty,
          maxBounty: preference.maxBounty,
          projectType: preference.projectType,
          isActive: preference.isActive,
          createdAt: preference.createdAt,
          updatedAt: preference.updatedAt,
        };
      } else {
        // In-memory storage
        return inMemoryStorage.userPreferences.get(userId) || null;
      }
    } catch (error) {
      debug('Error getting user preferences:', error);
      return null;
    }
  }

  async getAllActiveUsers(): Promise<UserPreferences[]> {
    try {
      if (this.usePrisma && this.prisma) {
        const preferences = await this.prisma.userPreference.findMany({
          where: { isActive: true },
        });

        return preferences.map((pref: any) => ({
          userId: Number(pref.userId),
          chatId: Number(pref.chatId),
          categories: pref.categories,
          minBounty: pref.minBounty,
          maxBounty: pref.maxBounty,
          projectType: pref.projectType,
          isActive: pref.isActive,
          createdAt: pref.createdAt,
          updatedAt: pref.updatedAt,
        }));
      } else {
        // In-memory storage
        return Array.from(inMemoryStorage.userPreferences.values())
          .filter((pref: UserPreferences) => pref.isActive);
      }
    } catch (error) {
      debug('Error getting all active users:', error);
      return [];
    }
  }

  async updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<void> {
    try {
      if (this.usePrisma && this.prisma) {
        await this.prisma.userPreference.update({
          where: { userId: BigInt(userId) },
          data: {
            ...(updates.chatId && { chatId: BigInt(updates.chatId) }),
            ...(updates.categories && { categories: updates.categories }),
            ...(updates.minBounty !== undefined && { minBounty: updates.minBounty }),
            ...(updates.maxBounty !== undefined && { maxBounty: updates.maxBounty }),
            ...(updates.projectType && { projectType: updates.projectType }),
            ...(updates.isActive !== undefined && { isActive: updates.isActive }),
            updatedAt: new Date(),
          },
        });
      } else {
        // In-memory storage
        const existing = inMemoryStorage.userPreferences.get(userId);
        if (existing) {
          inMemoryStorage.userPreferences.set(userId, {
            ...existing,
            ...updates,
            updatedAt: new Date(),
          });
        }
      }
      
      debug(`Updated user preferences for user ${userId}`);
    } catch (error) {
      debug('Error updating user preferences:', error);
      throw error;
    }
  }

  async deleteUserPreferences(userId: number): Promise<void> {
    try {
      if (this.usePrisma && this.prisma) {
        await this.prisma.userPreference.delete({
          where: { userId: BigInt(userId) },
        });
      } else {
        // In-memory storage
        inMemoryStorage.userPreferences.delete(userId);
      }
      
      debug(`Deleted user preferences for user ${userId}`);
    } catch (error) {
      debug('Error deleting user preferences:', error);
      throw error;
    }
  }

  // Notification log operations
  async logNotification(userId: number, listingId: number, success: boolean, error?: string): Promise<void> {
    try {
      if (this.usePrisma && this.prisma) {
        await this.prisma.notificationLog.create({
          data: {
            userId: BigInt(userId),
            listingId,
            success,
            error,
          },
        });
      } else {
        // In-memory storage
        inMemoryStorage.notificationLogs.push({
          userId,
          listingId,
          success,
          error,
          sentAt: new Date(),
        });
      }
      
      debug(`Logged notification for user ${userId}, listing ${listingId}, success: ${success}`);
    } catch (error) {
      debug('Error logging notification:', error);
      // Don't throw error for logging failures
    }
  }

  async getNotificationLog(userId: number, listingId: number): Promise<any | null> {
    try {
      if (this.usePrisma && this.prisma) {
        const notification = await this.prisma.notificationLog.findFirst({
          where: {
            userId: BigInt(userId),
            listingId,
            success: true,
          },
        });
        return notification;
      } else {
        // In-memory storage
        const notification = inMemoryStorage.notificationLogs.find(
          (log: any) => log.userId === userId && log.listingId === listingId && log.success
        );
        return notification || null;
      }
    } catch (error) {
      debug('Error getting notification log:', error);
      return null;
    }
  }

  // System config operations
  async getSystemConfig(key: string): Promise<string | null> {
    try {
      if (this.usePrisma && this.prisma) {
        const config = await this.prisma.systemConfig.findUnique({
          where: { key },
        });
        
        return config?.value || null;
      } else {
        // In-memory storage
        return inMemoryStorage.systemConfig.get(key) || null;
      }
    } catch (error) {
      debug('Error getting system config:', error);
      return null;
    }
  }

  async setSystemConfig(key: string, value: string): Promise<void> {
    try {
      if (this.usePrisma && this.prisma) {
        await this.prisma.systemConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      } else {
        // In-memory storage
        inMemoryStorage.systemConfig.set(key, value);
      }
      
      debug(`Set system config: ${key} = ${value}`);
    } catch (error) {
      debug('Error setting system config:', error);
      throw error;
    }
  }

  // Cleanup operations
  async cleanup(): Promise<void> {
    try {
      if (this.usePrisma && this.prisma) {
        await this.prisma.$disconnect();
      }
      debug('Database connection closed');
    } catch (error) {
      debug('Error during cleanup:', error);
    }
  }
} 