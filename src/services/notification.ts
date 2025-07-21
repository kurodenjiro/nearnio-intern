import { Context } from 'telegraf';
import createDebug from 'debug';
import { SuperteamListing, UserPreferences } from '../types/superteam';
import { escapeMarkdownV2 } from '../utils/markdown';
import { ReminderService } from './reminder';

const debug = createDebug('bot:notification');

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private formatBountyAmount(listing: SuperteamListing): string {
    return `${listing.rewardAmount} ${listing.token}`;
  }

  private formatDeadline(deadline: string): string {
    const date = new Date(deadline);
    return date.toLocaleDateString();
  }

  private formatSubmissions(count: number): string {
    return `${count} submission${count !== 1 ? 's' : ''}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async createListingMessage(listing: any, userId?: number): Promise<{ text: string; keyboard?: any }> {
    // Ensure all required fields exist with fallbacks
    const title = listing.title || 'Untitled Listing';
    const rewardAmount = listing.rewardAmount || 0;
    const token = listing.token || 'USD';
    const deadline = listing.deadline ? new Date(listing.deadline).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }) : 'No deadline';
    const submissionCount = listing.submissionCount || 0;
    const sponsorName = listing.sponsorName || 'Unknown Sponsor';
    const sponsorSlug = listing.sponsorSlug || '';
    const listingSlug = listing.slug || '';
    const sequentialId = listing.sequentialId || '';
    const listingType = listing.type || 'Unknown';
    const status = listing.status || 'Unknown';
    
    const bountyAmount = `${rewardAmount} ${token}`;
    const submissions = `${submissionCount} submission${submissionCount !== 1 ? 's' : ''}`;
    const sponsorVerified = listing.sponsorIsVerified ? '✅' : '';
    const category = listing.mappedCategory ? `\n🏷️ *Category:* ${escapeMarkdownV2(listing.mappedCategory)}` : '';

    // Format skills and subskills
    let skillsText = '';
    if (listing.skills && Array.isArray(listing.skills) && listing.skills.length > 0) {
      const skillsList = listing.skills.map((skill: any) => {
        let skillText = `• ${escapeMarkdownV2(skill.skills || 'Unknown Skill')}`;
        if (skill.subskills && Array.isArray(skill.subskills) && skill.subskills.length > 0) {
          skillText += ` \\(${escapeMarkdownV2(skill.subskills.join(', '))}\\)`;
        }
        return skillText;
      });
      skillsText = `\n🛠️ *Skills:*\n${skillsList.join('\n')}`;
    }

    const message = `🎯 *New Bounty Alert\\!*

*${escapeMarkdownV2(title)}*

💰 *Reward:* ${escapeMarkdownV2(bountyAmount)}
🏢 *Sponsor:* ${escapeMarkdownV2(sponsorName)} ${sponsorVerified}
📅 *Deadline:* ${escapeMarkdownV2(deadline)}
📊 *Type:* ${escapeMarkdownV2(listingType)}${category}
📝 *Submissions:* ${escapeMarkdownV2(submissions)}
🏷️ *Status:* ${escapeMarkdownV2(status)}${skillsText}`;

    // Check if user has an active reminder for this listing
    let reminderButtonText = '⏰ Remind Deadline';
    let reminderCallbackData = `add_reminder_${listing.id || listing.sequentialId}`;
    
    if (userId) {
      const reminderService = ReminderService.getInstance();
      const hasReminder = await reminderService.hasActiveReminder(userId, listing.id || listing.sequentialId);
      
      if (hasReminder) {
        reminderButtonText = '✅ Reminder Set';
        reminderCallbackData = `stop_reminder_${listing.id || listing.sequentialId}`;
      }
    }

    // Create inline keyboard for view details and reminder buttons
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🔗 View Details',
            url: `${process.env.SERVER_URL || 'https://nearn.io'}/${sponsorSlug}/${sequentialId || listingSlug}`
          }
        ],
        [
          {
            text: reminderButtonText,
            callback_data: reminderCallbackData
          }
        ]
      ]
    };

    return { text: message, keyboard };
  }

  private matchesUserPreferences(listing: any, preferences: UserPreferences): boolean {
    // Check bounty amount (use USD amount if available, otherwise use original)
    const bountyAmount = listing.usdAmount || listing.rewardAmount;
    debug(`Checking bounty: ${bountyAmount} vs min: ${preferences.minBounty}, max: ${preferences.maxBounty}`);
    
    if (bountyAmount < preferences.minBounty) {
      debug(`Bounty ${bountyAmount} below minimum ${preferences.minBounty}`);
      return false;
    }
    if (preferences.maxBounty && bountyAmount > preferences.maxBounty) {
      debug(`Bounty ${bountyAmount} above maximum ${preferences.maxBounty}`);
      return false;
    }

    // Check project type
    if (listing.type !== preferences.projectType) {
      debug(`Project type mismatch: ${listing.type} vs ${preferences.projectType}`);
      return false;
    }

    // Check categories if specified and listing has mapped category
    if (preferences.categories.length > 0 && listing.mappedCategory) {
      if (!preferences.categories.includes(listing.mappedCategory)) {
        debug(`Category mismatch: ${listing.mappedCategory} not in ${preferences.categories}`);
        return false;
      }
    }
    
    debug(`Listing matches preferences for user ${preferences.userId}`);
    return true;
  }

  async sendNotificationToUser(
    ctx: Context,
    listing: SuperteamListing,
    preferences: UserPreferences
  ): Promise<void> {
    try {
      const { text, keyboard } = await this.createListingMessage(listing, preferences.userId);
      await ctx.replyWithMarkdownV2(text, { 
        parse_mode: 'MarkdownV2',
        reply_markup: keyboard
      });
      debug(`Sent notification to user ${preferences.userId} for listing ${listing.id}`);
    } catch (error) {
      debug(`Failed to send notification to user ${preferences.userId}:`, error);
    }
  }

  async sendNotificationsForListings(
    bot: any,
    listings: any[],
    allPreferences: UserPreferences[]
  ): Promise<void> {
    debug(`Processing ${listings.length} listings for ${allPreferences.length} users`);

    for (const preferences of allPreferences) {
      if (!preferences.isActive) continue;

      debug(`User ${preferences.userId} preferences: minBounty=${preferences.minBounty}, maxBounty=${preferences.maxBounty}, projectType=${preferences.projectType}, categories=${preferences.categories}`);

      const matchingListings = listings.filter(listing => 
        this.matchesUserPreferences(listing, preferences)
      );

      if (matchingListings.length > 0) {
        debug(`Found ${matchingListings.length} matching listings for user ${preferences.userId}`);
        
        for (const listing of matchingListings) {
          try {
            const { text, keyboard } = await this.createListingMessage(listing, preferences.userId);
            await bot.telegram.sendMessage(
              preferences.chatId,
              text,
              { 
                parse_mode: 'MarkdownV2',
                reply_markup: keyboard
              }
            );
            // Add a small delay to avoid rate limiting
            await this.delay(100);
          } catch (error) {
            debug(`Failed to send notification to user ${preferences.userId}:`, error);
          }
        }
      }
    }
  }

  async sendWelcomeMessage(ctx: Context): Promise<void> {
    const message = `🎉 *Welcome to Superteam Bounty Notifications\\!*

I'll help you stay updated with new bounties that match your preferences\\.

Use these commands to get started:
• /start \\- Start the setup process
• /setup \\- Configure your preferences
• /preferences \\- View your current preferences
• /help \\- Show all available commands

Let's get started\\! Use /setup to configure your preferences\\.`;

    await ctx.replyWithMarkdownV2(message, { parse_mode: 'MarkdownV2' });
  }

  async sendHelpMessage(ctx: Context): Promise<void> {
    const message = `📚 *Available Commands*

🔧 *Setup & Configuration:*
• /start \\- Start the bot and setup process
• /setup \\- Configure your bounty preferences
• /preferences \\- View your current preferences
• /edit \\- Edit your preferences

📊 *Information:*
• /stats \\- View your notification statistics
• /help \\- Show this help message

⚙️ *Management:*
• /pause \\- Pause notifications temporarily
• /resume \\- Resume notifications
• /stop \\- Stop all notifications and delete preferences

💡 *Tips:*
• Set realistic bounty ranges to avoid spam
• Choose specific skills for better matches
• Use /pause when you're busy to avoid notifications\\.`;

    await ctx.replyWithMarkdownV2(message, { parse_mode: 'MarkdownV2' });
  }
} 