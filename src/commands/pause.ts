import { Context } from 'telegraf';
import createDebug from 'debug';
import { StorageService } from '../services/storage';

const debug = createDebug('bot:pause_command');

const pause = () => async (ctx: Context) => {
  debug('Triggered "pause" command');
  
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

    if (!userPreferences.isActive) {
      await ctx.reply('⏸️ Your notifications are already paused.');
      return;
    }

    await storage.updateUserPreferences(userId, { isActive: false });

    const message = `⏸️ *Notifications Paused*

You won't receive any new bounty notifications until you resume them.

Use /resume to start receiving notifications again.`;

    await ctx.replyWithMarkdownV2(message, { parse_mode: 'MarkdownV2' });
    
  } catch (error) {
    debug('Error in pause command:', error);
    await ctx.reply('❌ An error occurred. Please try again later.');
  }
};

export { pause }; 