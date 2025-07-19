import { Context } from 'telegraf';
import createDebug from 'debug';
import { NotificationService } from '../services/notification';
import { StorageService } from '../services/storage';

const debug = createDebug('bot:start_command');

const start = () => async (ctx: Context) => {
  debug('Triggered "start" command');
  
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  
  if (!userId || !chatId) {
    await ctx.reply('❌ Unable to identify user. Please try again.');
    return;
  }

  const storage = StorageService.getInstance();
  const notificationService = NotificationService.getInstance();

  try {
    // Check if user already exists
    const existingPreferences = await storage.getUserPreferences(userId);
    
    if (existingPreferences) {
      const message = `👋 *Welcome back!*

You already have preferences set up. Here's what you can do:

• /preferences - View your current settings
• /edit - Modify your preferences
• /stats - View your notification statistics
• /help - Show all available commands

Would you like to update your preferences? Use /edit to modify them.`;
      
      await ctx.replyWithMarkdownV2(message, { parse_mode: 'MarkdownV2' });
    } else {
      // Send welcome message for new users
      await notificationService.sendWelcomeMessage(ctx);
    }
  } catch (error) {
    debug('Error in start command:', error);
    await ctx.reply('❌ An error occurred. Please try again later.');
  }
};

export { start }; 