import { Context } from 'telegraf';
import createDebug from 'debug';
import { NotificationService } from '../services/notification';

const debug = createDebug('bot:help_command');

const help = () => async (ctx: Context) => {
  debug('Triggered "help" command');
  
  try {
    // Enhanced debugging
    debug('Context type:', typeof ctx);
    debug('Context reply method:', typeof ctx.reply);
    debug('Context from:', ctx.from);
    
    const notificationService = NotificationService.getInstance();
    debug('NotificationService instance created');
    
    await notificationService.sendHelpMessage(ctx);
    debug('Help message sent successfully');
    
  } catch (error) {
    debug('Error in help command:', error);
    debug('Error type:', typeof error);
    debug('Error message:', (error as any)?.message);
    debug('Error stack:', (error as any)?.stack);
    
    try {
      // Fallback help message with basic formatting
      const fallbackMessage = `📚 Available Commands

🔧 Setup & Configuration:
• /start - Start the bot and setup process
• /setup - Configure your bounty preferences
• /preferences - View your current preferences
• /edit - Edit your preferences

📊 Information:
• /stats - View your notification statistics
• /help - Show this help message

🤖 AI Chat:
• /agent {sponsor}/{id} - Start AI chat about a specific listing
• /stopchat - Stop active AI chat session

⚙️ Management:
• /pause - Pause notifications temporarily
• /resume - Resume notifications
• /stop - Stop all notifications and delete preferences

💡 Tips:
• Set realistic bounty ranges to avoid spam
• Choose specific skills for better matches
• Use /pause when you're busy to avoid notifications
• Use /agent to chat with AI about specific listings.`;

      await ctx.reply(fallbackMessage);
      debug('Fallback help message sent successfully');
      
    } catch (fallbackError) {
      debug('Fallback help message also failed:', fallbackError);
      
      // Final fallback - simple message
      try {
        await ctx.reply('❌ Help command temporarily unavailable. Please try again later.');
      } catch (finalError) {
        debug('Final fallback also failed:', finalError);
      }
    }
  }
};

export { help };
