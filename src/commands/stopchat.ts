import { Context } from 'telegraf';
import { ChatAIService } from '../services/chat-ai';
import { escapeMarkdownV2 } from '../utils/markdown';

export const stopchat = () => async (ctx: Context) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('❌ Unable to identify user');
      return;
    }

    const chatAIService = ChatAIService.getInstance();
    const result = await chatAIService.stopChatSession(userId);
    
    if (result.success) {
      await ctx.reply(
        escapeMarkdownV2(result.message),
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        `❌ ${escapeMarkdownV2(result.message)}`,
        { parse_mode: 'MarkdownV2' }
      );
    }
  } catch (error) {
    console.error('Error in stopchat command:', error);
    await ctx.reply('❌ An error occurred while stopping the chat session');
  }
};
