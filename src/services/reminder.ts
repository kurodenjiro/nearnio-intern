import { Context } from 'telegraf';
import createDebug from 'debug';
import { DatabaseService } from './database';

const debug = createDebug('bot:reminder');

export interface ReminderNotification {
  userId: number;
  listingId: number;
  listingSlug: string;
  title: string;
  deadline: Date;
  timeLeft: string;
  isFinal: boolean;
  sponsorSlug?: string;
  sequentialId?: number;
}

export class ReminderService {
  private static instance: ReminderService;
  private databaseService: DatabaseService;

  private constructor() {
    this.databaseService = DatabaseService.getInstance();
  }

  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  /**
   * Add a reminder for a user and listing
   */
  async addReminder(userId: number, listingId: number, listingSlug: string, title: string, deadline: Date): Promise<boolean> {
    try {
      if (this.databaseService.isUsingPrisma() && this.databaseService.getPrismaClient()) {
        await this.databaseService.getPrismaClient().userReminder.upsert({
          where: {
            userId_listingId: {
              userId: BigInt(userId),
              listingId: listingId
            }
          },
          update: {
            isActive: true,
            updatedAt: new Date()
          },
          create: {
            userId: BigInt(userId),
            listingId: listingId,
            listingSlug: listingSlug,
            title: title,
            deadline: deadline,
            isActive: true
          }
        });
        debug(`Reminder added for user ${userId}, listing ${listingId}`);
        return true;
      }
      return false;
    } catch (error) {
      debug('Error adding reminder:', error);
      return false;
    }
  }

  /**
   * Remove a reminder for a user and listing
   */
  async removeReminder(userId: number, listingId: number): Promise<boolean> {
    try {
      if (this.databaseService.isUsingPrisma() && this.databaseService.getPrismaClient()) {
        await this.databaseService.getPrismaClient().userReminder.updateMany({
          where: {
            userId: BigInt(userId),
            listingId: listingId
          },
          data: {
            isActive: false,
            updatedAt: new Date()
          }
        });
        debug(`Reminder removed for user ${userId}, listing ${listingId}`);
        return true;
      }
      return false;
    } catch (error) {
      debug('Error removing reminder:', error);
      return false;
    }
  }

  /**
   * Check if user has an active reminder for a listing
   */
  async hasActiveReminder(userId: number, listingId: number): Promise<boolean> {
    try {
      if (this.databaseService.isUsingPrisma() && this.databaseService.getPrismaClient()) {
        const reminder = await this.databaseService.getPrismaClient().userReminder.findFirst({
          where: {
            userId: BigInt(userId),
            listingId: listingId,
            isActive: true
          }
        });
        return !!reminder;
      }
      return false;
    } catch (error) {
      debug('Error checking reminder:', error);
      return false;
    }
  }

  /**
   * Get all active reminders that need notifications
   */
  async getDueReminders(): Promise<ReminderNotification[]> {
    try {
      if (!this.databaseService.isUsingPrisma() || !this.databaseService.getPrismaClient()) {
        return [];
      }

      const now = new Date();
      const activeReminders = await this.databaseService.getPrismaClient().userReminder.findMany({
        where: {
          isActive: true,
          deadline: {
            gt: now
          }
        }
      });

      const dueReminders: ReminderNotification[] = [];

      for (const reminder of activeReminders) {
        const timeLeft = this.calculateTimeLeft(reminder.deadline);
        if (timeLeft) {
          // Fetch listing data to get sponsorSlug and sequentialId
          const listing = await this.databaseService.getPrismaClient().listing.findUnique({
            where: { id: reminder.listingId },
            select: { sponsorSlug: true, sequentialId: true }
          });

          dueReminders.push({
            userId: Number(reminder.userId),
            listingId: reminder.listingId,
            listingSlug: reminder.listingSlug,
            title: reminder.title,
            deadline: reminder.deadline,
            timeLeft: timeLeft,
            isFinal: this.isFinalReminder(reminder.deadline),
            sponsorSlug: listing?.sponsorSlug,
            sequentialId: listing?.sequentialId
          });
        }
      }

      return dueReminders;
    } catch (error) {
      debug('Error getting due reminders:', error);
      return [];
    }
  }

  /**
   * Calculate time left and return appropriate message
   */
  public calculateTimeLeft(deadline: Date): string | null {
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    // Check specific time intervals
    if (diffDays > 0) {
      return `only ${diffDays} day${diffDays !== 1 ? 's' : ''} to submit`;
    } else if (diffHours >= 9) {
      return `only ${diffHours} hours to submit`;
    } else if (diffHours >= 6) {
      return `only ${diffHours} hours to submit`;
    } else if (diffHours >= 3) {
      return `only ${diffHours} hours to submit`;
    } else if (diffHours >= 1) {
      return `only ${diffHours} hour${diffHours !== 1 ? 's' : ''} to submit`;
    } else if (diffMinutes >= 30) {
      return `only ${diffMinutes} minutes to submit`;
    } else if (diffMs > 0) {
      return `submit was close`;
    }

    return null; // Deadline has passed
  }

  /**
   * Check if this is a final reminder (30 minutes or less)
   */
  public isFinalReminder(deadline: Date): boolean {
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes <= 30;
  }

  /**
   * Send reminder notification to user
   */
  async sendReminderNotification(bot: any, reminder: ReminderNotification): Promise<void> {
    try {
      // Use the correct URL format with sponsorSlug and sequentialId
      const listingUrl = reminder.sponsorSlug && reminder.sequentialId 
        ? `${process.env.SERVER_URL || 'https://nearn.io'}/${reminder.sponsorSlug}/${reminder.sequentialId}`
        : `${process.env.SERVER_URL || 'https://nearn.io'}/${reminder.listingSlug}`;

      const message = `⏰ *Deadline Reminder\\!*

*${reminder.title}*

${reminder.timeLeft}

🔗 [View Details](${listingUrl})`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🔗 View Details',
              url: listingUrl
            }
          ],
          [
            {
              text: '🛑 Stop Reminders',
              callback_data: `stop_reminder_${reminder.listingId}`
            }
          ]
        ]
      };

      await bot.telegram.sendMessage(reminder.userId, message, {
        parse_mode: 'MarkdownV2',
        reply_markup: keyboard
      });

      debug(`Reminder sent to user ${reminder.userId} for listing ${reminder.listingId}`);
    } catch (error) {
      debug('Error sending reminder notification:', error);
    }
  }

  /**
   * Handle stop reminder callback
   */
  async handleStopReminder(userId: number, listingId: number): Promise<boolean> {
    return await this.removeReminder(userId, listingId);
  }
} 