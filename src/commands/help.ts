import { Context } from 'telegraf';
import createDebug from 'debug';
import { NotificationService } from '../services/notification';

const debug = createDebug('bot:help_command');

const help = () => async (ctx: Context) => {
  debug('Triggered "help" command');
  
  const notificationService = NotificationService.getInstance();
  
  try {
    await notificationService.sendHelpMessage(ctx);
  } catch (error) {
    debug('Error in help command:', error);
    await ctx.reply('❌ An error occurred. Please try again later.');
  }
};

export { help }; 