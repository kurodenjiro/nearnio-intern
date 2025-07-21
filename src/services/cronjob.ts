import createDebug from 'debug';
import { Telegraf } from 'telegraf';
import { SuperteamApiService } from './superteam-api';
import { DatabaseService } from './database';
import { NotificationService } from './notification';
import { UserPreferences } from '../types/superteam';
import { ReminderService } from './reminder';

const debug = createDebug('bot:cronjob');

export class CronjobService {
  private static instance: CronjobService;
  private bot: Telegraf | null = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): CronjobService {
    if (!CronjobService.instance) {
      CronjobService.instance = new CronjobService();
    }
    return CronjobService.instance;
  }

  public setBot(bot: Telegraf): void {
    this.bot = bot;
  }

  public start(): void {
    debug('Cronjob service initialized (Vercel cron jobs will handle scheduling)');
    this.isRunning = true;
  }

  public stop(): void {
    this.isRunning = false;
    debug('Cronjob service stopped');
  }

  // Step 1: Sync API data to database
  public async syncApiDataToDatabase(): Promise<void> {
    try {
      debug('Starting API data sync to database...');
      
      const apiService = SuperteamApiService.getInstance();
      const databaseService = DatabaseService.getInstance();
      
      let totalSynced = 0;
      
      // Fetch and sync listings using "all" tab and "All" category
      try {
        debug('Fetching all listings from Superteam API');
        
        const listings = await apiService.fetchListings('all', ['All']);
        
        if (listings.length > 0) {
          const syncedCount = await databaseService.syncListings(listings);
          totalSynced += syncedCount;
          debug(`Synced ${syncedCount} listings`);
        }
        
      } catch (error) {
        debug('Error syncing listings:', error);
      }
      
      // Update last sync time
      await databaseService.setSystemConfig('last_sync_time', new Date().toISOString());
      
      debug(`API data sync completed. Total synced: ${totalSynced} listings`);
      
    } catch (error) {
      debug('Error during API data sync:', error);
    }
  }

  // Step 2: Send notifications from database
  public async sendNotificationsFromDatabase(): Promise<void> {
    if (!this.bot) {
      debug('Bot not set, skipping notification check');
      return;
    }

    try {
      debug('Checking for new listings to notify users...');
      
      const databaseService = DatabaseService.getInstance();
      const notificationService = NotificationService.getInstance();

      // Get all active users
      const activeUsers = await databaseService.getAllActiveUsers();
      
      if (activeUsers.length === 0) {
        debug('No active users found, skipping notification check');
        return;
      }

      // Get last notification check time
      const lastCheckTimeStr = await databaseService.getSystemConfig('last_notification_check');
      const lastCheckTime = lastCheckTimeStr ? new Date(lastCheckTimeStr) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago
      
      // Get new listings since last check
      const newListings = await databaseService.getNewListings(lastCheckTime);
      
      if (newListings.length === 0) {
        debug('No new listings found since last check');
        //return;
      }

      debug(`Found ${newListings.length} new listings, processing notifications`);

      let notificationCount = 0;
      
      // Process each user
      for (const user of activeUsers) {
        try {
          
          // Get listings that match user preferences
          const matchingListings = await databaseService.getListingsByFilters(
            user.projectType,
            user.categories,
            user.minBounty,
            user.maxBounty,
            lastCheckTime
          );
          debug(user.projectType, user.categories, user.minBounty, user.maxBounty, lastCheckTime)
          debug(matchingListings)

          if (matchingListings.length > 0) {
            // Send notifications for matching listings
            for (const listing of matchingListings) {
              // Check if notification has already been sent to this user for this listing
              const existingNotification = await databaseService.getNotificationLog(user.userId, listing.id);
              if (existingNotification) {
                debug(`Notification already sent to user ${user.userId} for listing ${listing.id}, skipping`);
                continue;
              }
              
              try {
              const { text, keyboard } = await notificationService.createListingMessage(listing, user.userId);
              await this.bot!.telegram.sendMessage(
                user.chatId,
                text,
                { 
                  parse_mode: 'MarkdownV2',
                  reply_markup: keyboard
                }
              );
                 
                 // Log the notification
                 await databaseService.logNotification(
                   user.userId,
                   listing.id,
                   true
                 );
                 
                 notificationCount++;
                 
                 // Add a small delay between notifications
                 await new Promise(resolve => setTimeout(resolve, 100));
                 
               } catch (error) {
                 debug(`Error sending notification for user ${user.userId}, listing ${listing.id}:`, error);
                 await databaseService.logNotification(
                   user.userId,
                   listing.id,
                   false,
                   error instanceof Error ? error.message : 'Unknown error'
                 );
               }
            }
          }
          
        } catch (error) {
          debug(`Error processing notifications for user ${user.userId}:`, error);
        }
      }
      
      // Update last notification check time
      await databaseService.setSystemConfig('last_notification_check', new Date().toISOString());
      
      debug(`Notification check completed. Sent ${notificationCount} notifications`);
      
    } catch (error) {
      debug('Error during notification check:', error);
    }
  }

  // Send reminder notifications
  public async sendReminderNotifications(): Promise<void> {
    try {
      if (!this.bot) {
        debug('Bot not initialized, skipping reminder notifications');
        return;
      }

      debug('Starting reminder notification check...');
      
      const reminderService = ReminderService.getInstance();
      const databaseService = DatabaseService.getInstance();
      
      // Get all due reminders
      const dueReminders = await reminderService.getDueReminders();
      
      if (dueReminders.length === 0) {
        debug('No due reminders found');
        return;
      }

      debug(`Found ${dueReminders.length} due reminders`);

      let sentCount = 0;
      
      for (const reminder of dueReminders) {
        try {
          // Send reminder notification
          await reminderService.sendReminderNotification(this.bot, reminder);
          sentCount++;
          
          // Add a small delay between notifications
          await this.delay(100);
          
        } catch (error) {
          debug(`Error sending reminder notification for user ${reminder.userId}, listing ${reminder.listingId}:`, error);
        }
      }
      
      // Update last reminder check time
      await databaseService.setSystemConfig('last_reminder_check', new Date().toISOString());
      
      debug(`Reminder check completed. Sent ${sentCount} reminder notifications`);
      
    } catch (error) {
      debug('Error during reminder check:', error);
    }
  }

  // Manual sync method
  public async manualSync(): Promise<void> {
    debug('Manual sync triggered');
    await this.syncApiDataToDatabase();
  }

  // Manual notification check method
  public async manualNotificationCheck(): Promise<void> {
    debug('Manual notification check triggered');
    await this.sendNotificationsFromDatabase();
  }

  // Manual reminder check method
  public async manualReminderCheck(): Promise<void> {
    debug('Manual reminder check triggered');
    await this.sendReminderNotifications();
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  // Utility method for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get sync status
  public async getSyncStatus(): Promise<{
    isRunning: boolean;
    lastSyncTime: string | null;
    lastNotificationCheck: string | null;
  }> {
    const databaseService = DatabaseService.getInstance();
    
    return {
      isRunning: this.isRunning,
      lastSyncTime: await databaseService.getSystemConfig('last_sync_time'),
      lastNotificationCheck: await databaseService.getSystemConfig('last_notification_check'),
    };
  }
} 