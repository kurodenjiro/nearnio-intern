import { Context } from 'telegraf';
import createDebug from 'debug';
import { SuperteamListing, UserPreferences } from '../types/superteam';
import { escapeMarkdownV2 } from '../utils/markdown';

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

  public createListingMessage(listing: SuperteamListing): string {
    const bountyAmount = this.formatBountyAmount(listing);
    const deadline = this.formatDeadline(listing.deadline);
    const submissions = this.formatSubmissions(listing._count.Submission);
    const sponsorVerified = listing.sponsor.isVerified ? '✅' : '';

    const message = `🎯 *New Bounty Alert\\!*

*${escapeMarkdownV2(listing.title)}*

💰 *Reward:* ${escapeMarkdownV2(bountyAmount)}
🏢 *Sponsor:* ${escapeMarkdownV2(listing.sponsor.name)} ${sponsorVerified}
📅 *Deadline:* ${escapeMarkdownV2(deadline)}
📊 *Type:* ${escapeMarkdownV2(listing.type)}
📝 *Submissions:* ${escapeMarkdownV2(submissions)}
🏷️ *Status:* ${escapeMarkdownV2(listing.status)}

🔗 [View Details](https://earn\\.superteam\\.fun/bounty/${escapeMarkdownV2(listing.slug)})`;

    return message;
  }

  private matchesUserPreferences(listing: SuperteamListing, preferences: UserPreferences): boolean {
    // Check bounty amount
    const bountyAmount = listing.rewardAmount;
    if (bountyAmount < preferences.minBounty) {
      return false;
    }
    if (preferences.maxBounty && bountyAmount > preferences.maxBounty) {
      return false;
    }

    // For now, we'll skip category and skills matching since the API doesn't provide them
    // In the future, we could add tags or other fields for filtering
    
    return true;
  }

  async sendNotificationToUser(
    ctx: Context,
    listing: SuperteamListing,
    preferences: UserPreferences
  ): Promise<void> {
    try {
      const message = this.createListingMessage(listing);
      await ctx.replyWithMarkdownV2(message, { parse_mode: 'MarkdownV2' });
      debug(`Sent notification to user ${preferences.userId} for listing ${listing.id}`);
    } catch (error) {
      debug(`Failed to send notification to user ${preferences.userId}:`, error);
    }
  }

  async sendNotificationsForListings(
    bot: any,
    listings: SuperteamListing[],
    allPreferences: UserPreferences[]
  ): Promise<void> {
    debug(`Processing ${listings.length} listings for ${allPreferences.length} users`);

    for (const preferences of allPreferences) {
      if (!preferences.isActive) continue;

      const matchingListings = listings.filter(listing => 
        this.matchesUserPreferences(listing, preferences)
      );

      if (matchingListings.length > 0) {
        debug(`Found ${matchingListings.length} matching listings for user ${preferences.userId}`);
        
        for (const listing of matchingListings) {
          try {
            await bot.telegram.sendMessage(
              preferences.chatId,
              this.createListingMessage(listing),
              { parse_mode: 'MarkdownV2' }
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