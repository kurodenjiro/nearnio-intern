import { Context } from 'telegraf';
import { ChatAIService } from '../services/chat-ai';
import { escapeMarkdownV2 } from '../utils/markdown';

export const agent = () => async (ctx: Context) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('❌ Unable to identify user');
      return;
    }

    const chatAIService = ChatAIService.getInstance();
    
    // Check if user has an active chat session
    const isActive = await chatAIService.isChatActive(userId);
    
    if (isActive) {
      await ctx.reply(
        `🤖 *Chat AI Session Active*\n\n` +
        `You already have an active chat session\\. Use /stopchat to end it first\\.\n\n` +
        `Or continue chatting by sending me a message\\!`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Extract sponsor and id from command
    const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const parts = messageText.split(' ');
    
    if (parts.length < 2) {
      await ctx.reply(
        `🤖 *Chat AI Agent*\n\n` +
        `Usage: /agent {sponsor}/{id}\n\n` +
        `Example: /agent superteam/123\n\n` +
        `This will start a chat session with AI about the specific listing\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const sponsorAndId = parts[1];
    const [sponsor, idStr] = sponsorAndId.split('/');
    
    if (!sponsor || !idStr) {
      await ctx.reply(
        `❌ *Invalid Format*\n\n` +
        `Please use: /agent {sponsor}/{id}\n\n` +
        `Example: /agent superteam/123`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const listingId = parseInt(idStr);
    if (isNaN(listingId)) {
      await ctx.reply(
        `❌ *Invalid ID*\n\n` +
        `The ID must be a number\\.\n\n` +
        `Example: /agent superteam/123`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Start chat session
    const result = await chatAIService.startChatSession(userId, listingId);
    
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
    console.error('Error in agent command:', error);
    await ctx.reply('❌ An error occurred while starting the chat session');
  }
};
