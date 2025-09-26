import { Context } from 'telegraf';
import createDebug from 'debug';
import { StorageService } from '../services/storage';
import { UserPreferences } from '../types/superteam';
import { startSetup, createBountyRangeKeyboard } from '../handlers/message-handler';

const debug = createDebug('bot:setup_command');

  // Available categories from Superteam
  const AVAILABLE_CATEGORIES = [
    'All',
  'Content',
  'Design',
  'Development',
  'Other'
];

// Available project types
const PROJECT_TYPES = [
  'bounty',
  'project',
  'all'
];

const setup = () => async (ctx: Context) => {
  debug('Triggered "setup" command');
  
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  
  if (!userId || !chatId) {
    await ctx.reply('❌ Unable to identify user. Please try again.');
    return;
  }

  const storage = StorageService.getInstance();

  try {
    // Check if user already has preferences
    const existingPreferences = await storage.getUserPreferences(userId);
    
    if (existingPreferences) {
      const message = `⚠️ *You already have preferences set up\\!*

Use /edit to modify your existing preferences, or /preferences to view them\\.

If you want to start fresh, use /stop to delete your current preferences first\\.`;
      
      await ctx.replyWithMarkdownV2(message, { parse_mode: 'MarkdownV2' });
      return;
    }

    // Start setup process
    await startSetup(ctx);
    
    const message = `🎯 *Let's set up your bounty preferences\\!*

I'll ask you a few questions to customize your notifications\\.

*Step 1: Bounty Range*
What bounty range are you interested in?

Select from the buttons below:`;
    
    await ctx.replyWithMarkdownV2(message, { 
      parse_mode: 'MarkdownV2',
      reply_markup: createBountyRangeKeyboard()
    });
    
  } catch (error) {
    debug('Error in setup command:', error);
    await ctx.reply('❌ An error occurred. Please try again later.');
  }
};

// Helper function to create category selection keyboard
const createCategoryKeyboard = () => {
  const keyboard = [];
  const rowSize = 2;
  
  for (let i = 0; i < AVAILABLE_CATEGORIES.length; i += rowSize) {
    const row = AVAILABLE_CATEGORIES.slice(i, i + rowSize);
    keyboard.push(row);
  }
  
  return keyboard;
};

// Helper function to create project type selection keyboard
const createProjectTypeKeyboard = () => {
  return [PROJECT_TYPES];
};

export { setup, createCategoryKeyboard, createProjectTypeKeyboard, AVAILABLE_CATEGORIES, PROJECT_TYPES }; 