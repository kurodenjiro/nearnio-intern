import { Context } from 'telegraf';
import createDebug from 'debug';
import { StorageService } from '../services/storage';
import { escapeMarkdownV2 } from '../utils/markdown';

const debug = createDebug('bot:edit_command');

const edit = () => async (ctx: Context) => {
  debug('Triggered "edit" command');
  
  const userId = ctx.from?.id;
  
  if (!userId) {
    await ctx.reply('❌ Unable to identify user. Please try again.');
    return;
  }

  const storage = StorageService.getInstance();

  try {
    const userPreferences = await storage.getUserPreferences(userId);
    
    if (!userPreferences) {
      const message = `❌ *No preferences found\\!*

You haven't set up your preferences yet\\. Use /setup to configure your bounty notifications\\.`;
      
      await ctx.replyWithMarkdownV2(message, { parse_mode: 'MarkdownV2' });
      return;
    }

    const message = `✏️ *Edit Your Preferences*

Currently, you can edit your preferences by using /stop to delete them and then /setup to create new ones\\.

*Your current settings:*
💰 *Bounty Range:* $${userPreferences.minBounty}${userPreferences.maxBounty ? ` \\- $${userPreferences.maxBounty}` : '\\+'}
📂 *Categories:* ${escapeMarkdownV2(userPreferences.categories.length > 0 ? userPreferences.categories.map((cat: string) => {
      const categoryMap: Record<string, string> = {
        'DEV': 'Development',
        'DESIGN': 'Design',
        'CONTENT': 'Content',
        'GROWTH': 'Growth',
        'COMMUNITY': 'Community',
        'OTHER': 'Other',
        'All': 'All'
      };
      return categoryMap[cat] || cat;
    }).join(', ') : 'All')}
🎯 *Project Type:* ${escapeMarkdownV2(userPreferences.projectType === 'all' ? 'All' : (userPreferences.projectType || 'bounty').charAt(0).toUpperCase() + (userPreferences.projectType || 'bounty').slice(1))}

*To edit:*
1\\. Use /stop to delete current preferences
2\\. Use /setup to create new preferences

*Or use these commands:*
• /preferences \\- View current settings
• /pause \\- Pause notifications
• /resume \\- Resume notifications`;

    await ctx.replyWithMarkdownV2(message, { parse_mode: 'MarkdownV2' });
    
  } catch (error) {
    debug('Error in edit command:', error);
    await ctx.reply('❌ An error occurred. Please try again later.');
  }
};

export { edit }; 