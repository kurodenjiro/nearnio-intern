import { Context } from 'telegraf';
import createDebug from 'debug';
import { StorageService } from '../services/storage';
import { escapeMarkdownV2 } from '../utils/markdown';

const debug = createDebug('bot:stats_command');

const stats = () => async (ctx: Context) => {
  debug('Triggered "stats" command');
  
  const userId = ctx.from?.id;
  
  if (!userId) {
    await ctx.reply('❌ Unable to identify user. Please try again.');
    return;
  }

  const storage = StorageService.getInstance();

  try {
    const userPreferences = await storage.getUserPreferences(userId);
    
    if (!userPreferences) {
      const message = `❌ *No preferences found!*

You haven't set up your preferences yet. Use /setup to configure your bounty notifications.`;
      
      await ctx.replyWithMarkdownV2(message, { parse_mode: 'MarkdownV2' });
      return;
    }

    const totalUsers = await storage.getActiveUserCount();
    const status = userPreferences.isActive ? '✅ Active' : '⏸️ Paused';
    const lastUpdated = userPreferences.updatedAt.toLocaleDateString();
    const checkInterval = 5; // New system checks every 5 minutes

    const message = `📊 *Your Statistics*

${status}

💰 *Bounty Range:* $${userPreferences.minBounty}${userPreferences.maxBounty ? ` \\- $${userPreferences.maxBounty}` : '+'}
📂 *Categories:* ${escapeMarkdownV2(userPreferences.categories.length > 0 ? userPreferences.categories.join(', ') : 'All')}
🎯 *Project Type:* ${escapeMarkdownV2(userPreferences.projectType || 'bounties')}

📅 *Last Updated:* ${escapeMarkdownV2(lastUpdated)}
⏰ *Check Interval:* ${checkInterval} minutes

👥 *Total Active Users:* ${totalUsers}

*Commands:*
• /preferences \\- View detailed preferences
• /edit \\- Modify your settings
• /help \\- Show all commands`;

    await ctx.replyWithMarkdownV2(message, { parse_mode: 'MarkdownV2' });
    
  } catch (error) {
    debug('Error in stats command:', error);
    await ctx.reply('❌ An error occurred. Please try again later.');
  }
};

export { stats }; 