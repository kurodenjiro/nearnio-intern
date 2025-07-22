import { Context } from 'telegraf';
import createDebug from 'debug';
import { StorageService } from '../services/storage';
import { escapeMarkdownV2 } from '../utils/markdown';

const debug = createDebug('bot:resume_command');

const resume = () => async (ctx: Context) => {
  debug('Triggered "resume" command');
  
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

    if (userPreferences.isActive) {
      await ctx.reply('✅ Your notifications are already active.');
      return;
    }

    await storage.updateUserPreferences(userId, { isActive: true });

    const message = `✅ *Notifications Resumed*

You'll now receive notifications for new bounties that match your preferences\\.

Use /preferences to view your current settings\\.`;

    await ctx.replyWithMarkdownV2(message, { parse_mode: 'MarkdownV2' });
    
  } catch (error) {
    debug('Error in resume command:', error);
    await ctx.reply('❌ An error occurred. Please try again later.');
  }
};

export { resume }; 