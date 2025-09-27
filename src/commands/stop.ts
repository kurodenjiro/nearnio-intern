import { Context } from 'telegraf';
import createDebug from 'debug';
import { DatabaseService } from '../services/database';

const debug = createDebug('bot:stop_command');

const stop = () => async (ctx: Context) => {
  debug('Triggered "stop" command');
  
  const userId = ctx.from?.id;
  
  if (!userId) {
    await ctx.reply('❌ Unable to identify user. Please try again.');
    return;
  }

  const databaseService = DatabaseService.getInstance();

  try {
    const userPreferences = await databaseService.getUserPreferences(userId);
    
    if (!userPreferences) {
      const message = `❌ *No preferences found\\!*

You haven't set up your preferences yet\\. Use /setup to configure your bounty notifications\\.`;
      
      await ctx.replyWithMarkdownV2(message, { parse_mode: 'MarkdownV2' });
      return;
    }

    // Delete user preferences and notification settings
    await databaseService.deleteUserPreferences(userId);
    
    const message = `🗑️ *Preferences Deleted*

Your preferences and notification settings have been removed\\.

You can use /start to set up new preferences anytime\\.`;

    await ctx.replyWithMarkdownV2(message, { parse_mode: 'MarkdownV2' });
    
  } catch (error) {
    debug('Error in stop command:', error);
    await ctx.reply('❌ An error occurred. Please try again later.');
  }
};

export { stop }; 