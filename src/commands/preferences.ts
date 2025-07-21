import { Context } from 'telegraf';
import createDebug from 'debug';
import { StorageService } from '../services/storage';
import { escapeMarkdownV2 } from '../utils/markdown';

const debug = createDebug('bot:preferences_command');

const preferences = () => async (ctx: Context) => {
  debug('Triggered "preferences" command');
  
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

    const formatCategories = (categories: string[]) => {
      const categoryMap: Record<string, string> = {
        'DEV': 'Development',
        'DESIGN': 'Design',
        'CONTENT': 'Content',
        'GROWTH': 'Growth',
        'COMMUNITY': 'Community',
        'OTHER': 'Other',
        'All': 'All'
      };
      
      if (categories.length === 0) return 'All categories';
      
      return categories.map(cat => categoryMap[cat] || cat).join(', ');
    };

    const formatProjectType = (projectType: string) => {
      const projectTypeMap: Record<string, string> = {
        'bounty': 'Bounty',
        'project': 'Project',
        'all': 'All'
      };
      return projectTypeMap[projectType] || 'Bounty';
    };

    const formatBountyRange = (min: number, max?: number) => {
      if (max) {
        return `$${min} - $${max}`;
      }
      return `$${min}+`;
    };

    const status = userPreferences.isActive ? '✅ Active' : '⏸️ Paused';

    const message = `📋 *Your Current Preferences*

${status}

💰 *Bounty Range:* ${escapeMarkdownV2(formatBountyRange(userPreferences.minBounty, userPreferences.maxBounty))}
📂 *Categories:* ${escapeMarkdownV2(formatCategories(userPreferences.categories))}
🎯 *Project Type:* ${escapeMarkdownV2(formatProjectType(userPreferences.projectType))}

📅 *Last Updated:* ${escapeMarkdownV2(userPreferences.updatedAt.toLocaleDateString())}

*Commands:*
• /edit \\- Modify your preferences
• /pause \\- Pause notifications
• /resume \\- Resume notifications
• /stop \\- Delete preferences`;

    await ctx.replyWithMarkdownV2(message, { parse_mode: 'MarkdownV2' });
    
  } catch (error) {
    debug('Error in preferences command:', error);
    await ctx.reply('❌ An error occurred. Please try again later.');
  }
};

export { preferences }; 