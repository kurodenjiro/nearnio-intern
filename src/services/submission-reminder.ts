import createDebug from 'debug';
import { DatabaseService } from './database';
import { SubmissionApiService } from './submission-api';

const debug = createDebug('bot:submission-reminder');

interface SubmissionReminder {
  id: number;
  userId: number;
  listingId: number;
  listingSlug: string;
  title: string;
  sponsorSlug: string;
  sequentialId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastCheckTime: Date;
}

export class SubmissionReminderService {
  private static instance: SubmissionReminderService;
  private databaseService: DatabaseService;
  private submissionApiService: SubmissionApiService;

  private constructor() {
    this.databaseService = DatabaseService.getInstance();
    this.submissionApiService = SubmissionApiService.getInstance();
  }

  public static getInstance(): SubmissionReminderService {
    if (!SubmissionReminderService.instance) {
      SubmissionReminderService.instance = new SubmissionReminderService();
    }
    return SubmissionReminderService.instance;
  }

  async addSubmissionReminder(
    userId: number, 
    listingId: number, 
    listingSlug: string, 
    title: string,
    sponsorSlug: string,
    sequentialId: number
  ): Promise<boolean> {
    try {
      debug(`Adding submission reminder for user ${userId}, listing ${listingId}`);

      if (this.databaseService.isUsingPrisma() && this.databaseService.getPrismaClient()) {
        const prisma = this.databaseService.getPrismaClient();
        
        await prisma.submissionReminder.upsert({
          where: {
            userId_listingId: {
              userId: BigInt(userId),
              listingId: listingId
            }
          },
          update: {
            listingSlug,
            title,
            sponsorSlug,
            sequentialId,
            isActive: true,
            lastCheckTime: new Date(),
            updatedAt: new Date()
          },
          create: {
            userId: BigInt(userId),
            listingId,
            listingSlug,
            title,
            sponsorSlug,
            sequentialId,
            isActive: true,
            lastCheckTime: new Date()
          }
        });
      } else {
        // In-memory storage fallback
        const key = `${userId}-${listingId}`;
        // This would need to be implemented in the database service
        debug('In-memory storage for submission reminders not implemented yet');
        return false;
      }

      debug(`Submission reminder added successfully for user ${userId}, listing ${listingId}`);
      return true;
    } catch (error) {
      debug(`Error adding submission reminder:`, error);
      return false;
    }
  }

  async removeSubmissionReminder(userId: number, listingId: number): Promise<boolean> {
    try {
      debug(`Removing submission reminder for user ${userId}, listing ${listingId}`);

      if (this.databaseService.isUsingPrisma() && this.databaseService.getPrismaClient()) {
        const prisma = this.databaseService.getPrismaClient();
        
        await prisma.submissionReminder.updateMany({
          where: {
            userId: BigInt(userId),
            listingId: listingId
          },
          data: {
            isActive: false,
            updatedAt: new Date()
          }
        });
      }

      debug(`Submission reminder removed successfully for user ${userId}, listing ${listingId}`);
      return true;
    } catch (error) {
      debug(`Error removing submission reminder:`, error);
      return false;
    }
  }

  async hasActiveSubmissionReminder(userId: number, listingId: number): Promise<boolean> {
    try {
      if (this.databaseService.isUsingPrisma() && this.databaseService.getPrismaClient()) {
        const prisma = this.databaseService.getPrismaClient();
        
        const reminder = await prisma.submissionReminder.findFirst({
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
      debug(`Error checking submission reminder:`, error);
      return false;
    }
  }

  async getActiveSubmissionReminders(): Promise<SubmissionReminder[]> {
    try {
      if (this.databaseService.isUsingPrisma() && this.databaseService.getPrismaClient()) {
        const prisma = this.databaseService.getPrismaClient();
        
        const reminders = await prisma.submissionReminder.findMany({
          where: {
            isActive: true
          }
        });

        return reminders.map((reminder: any) => ({
          id: reminder.id,
          userId: Number(reminder.userId),
          listingId: reminder.listingId,
          listingSlug: reminder.listingSlug,
          title: reminder.title,
          sponsorSlug: reminder.sponsorSlug,
          sequentialId: reminder.sequentialId,
          isActive: reminder.isActive,
          createdAt: reminder.createdAt,
          updatedAt: reminder.updatedAt,
          lastCheckTime: reminder.lastCheckTime
        }));
      }

      return [];
    } catch (error) {
      debug(`Error getting active submission reminders:`, error);
      return [];
    }
  }

  async checkAndSendSubmissionNotifications(): Promise<number> {
    try {
      debug('Checking for new submissions and status changes...');
      
      const reminders = await this.getActiveSubmissionReminders();
      let notificationCount = 0;

      for (const reminder of reminders) {
        try {
          // Check for new submissions
          const newSubmissions = await this.submissionApiService.getNewSubmissions(
            reminder.sponsorSlug,
            reminder.sequentialId,
            reminder.lastCheckTime
          );

          // Check for approved submissions
          const approvedSubmissions = await this.submissionApiService.getApprovedSubmissions(
            reminder.sponsorSlug,
            reminder.sequentialId,
            reminder.lastCheckTime
          );

          if (newSubmissions.length > 0 || approvedSubmissions.length > 0) {
            await this.sendSubmissionNotification(reminder, newSubmissions, approvedSubmissions);
            notificationCount++;

            // Update last check time
            await this.updateLastCheckTime(reminder.id);
          }
        } catch (error) {
          debug(`Error checking submissions for reminder ${reminder.id}:`, error);
        }
      }

      debug(`Sent ${notificationCount} submission notifications`);
      return notificationCount;
    } catch (error) {
      debug('Error checking submission notifications:', error);
      return 0;
    }
  }

  private async sendSubmissionNotification(
    reminder: SubmissionReminder,
    newSubmissions: any[],
    approvedSubmissions: any[]
  ): Promise<void> {
    try {
      const botToken = process.env.BOT_TOKEN;
      if (!botToken) {
        debug('BOT_TOKEN not configured');
        return;
      }

      let message = `📝 *Submission Update for "${reminder.title}"*\n\n`;

      if (newSubmissions.length > 0) {
        message += `🆕 *New Submissions:* ${newSubmissions.length}\n`;
        newSubmissions.forEach((submission, index) => {
          message += `   ${index + 1}. ${submission.user.name} - ${submission.status}\n`;
        });
        message += '\n';
      }

      if (approvedSubmissions.length > 0) {
        message += `✅ *Approved Submissions:* ${approvedSubmissions.length}\n`;
        approvedSubmissions.forEach((submission, index) => {
          message += `   ${index + 1}. ${submission.user.name} - Approved\n`;
        });
        message += '\n';
      }

      message += `🔗 [View Details](${process.env.SERVER_URL || 'https://nearn.io'}/${reminder.sponsorSlug}/${reminder.sequentialId})`;

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: reminder.userId,
          text: message,
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🛑 Stop Submission Reminders',
                  callback_data: `stop_submission_reminder_${reminder.listingId}`
                }
              ]
            ]
          }
        })
      });

      if (!response.ok) {
        debug(`Failed to send submission notification to user ${reminder.userId}`);
      }
    } catch (error) {
      debug(`Error sending submission notification:`, error);
    }
  }

  private async updateLastCheckTime(reminderId: number): Promise<void> {
    try {
      if (this.databaseService.isUsingPrisma() && this.databaseService.getPrismaClient()) {
        const prisma = this.databaseService.getPrismaClient();
        
        await prisma.submissionReminder.update({
          where: { id: reminderId },
          data: {
            lastCheckTime: new Date(),
            updatedAt: new Date()
          }
        });
      }
    } catch (error) {
      debug(`Error updating last check time:`, error);
    }
  }
}
