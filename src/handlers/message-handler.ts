import { Context } from 'telegraf';
import createDebug from 'debug';
import { StorageService } from '../services/storage';
import { UserPreferences } from '../types/superteam';
import { escapeMarkdownV2 } from '../utils/markdown';
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';

const debug = createDebug('bot:message-handler');

// Simple in-memory state management for setup process
const setupStates = new Map<number, {
  step: 'bountyRange' | 'categories' | 'projectType' | 'complete';
  data: Partial<UserPreferences>;
}>();

// Available categories and project types
const AVAILABLE_CATEGORIES = [
  'For You', 'All', 'Content', 'Design', 'Development', 'Other'
];

const PROJECT_TYPES = ['bounties', 'projects'];

// Bounty range options
const BOUNTY_RANGES = [
  { text: '0-50$', min: 0, max: 50, name: 'Micro Bounties' },
  { text: '50$-100$', min: 51, max: 100, name: 'Small Bounties' },
  { text: '100$-250$', min: 101, max: 250, name: 'Medium Bounties' },
  { text: '250$-500$', min: 251, max: 500, name: 'Large Bounties' },
  { text: '500$-1000$', min: 501, max: 1000, name: 'Premium Bounties' },
  { text: '>1000$', min: 1001, max: undefined, name: 'Enterprise Bounties' }
];

// Helper function to create category selection keyboard
const createCategoryKeyboard = (): InlineKeyboardMarkup => {
  const keyboard = [];
  
  // First row: For You and All (exclusive options)
  keyboard.push([
    { text: 'For You', callback_data: 'category_For You' },
    { text: 'All', callback_data: 'category_All' }
  ]);
  
  // Second row: Content and Design
  keyboard.push([
    { text: 'Content', callback_data: 'category_Content' },
    { text: 'Design', callback_data: 'category_Design' }
  ]);
  
  // Third row: Development and Other
  keyboard.push([
    { text: 'Development', callback_data: 'category_Development' },
    { text: 'Other', callback_data: 'category_Other' }
  ]);
  
  // Add back button
  keyboard.push([{
    text: '⬅️ Back',
    callback_data: 'back_categories'
  }]);
  
  return { inline_keyboard: keyboard };
};

// Helper function to create bounty range selection keyboard
const createBountyRangeKeyboard = (): InlineKeyboardMarkup => {
  const keyboard = BOUNTY_RANGES.map(range => [{
    text: `${range.text} (${range.name})`,
    callback_data: `bounty_range_${range.min}_${range.max || 'none'}`
  }]);
  
  return { inline_keyboard: keyboard };
};

// Helper function to create project type selection keyboard
const createProjectTypeKeyboard = (): InlineKeyboardMarkup => {
  const keyboard = PROJECT_TYPES.map(type => [{
    text: type.charAt(0).toUpperCase() + type.slice(1),
    callback_data: `project_type_${type}`
  }]);
  
  // Add back button
  keyboard.push([{
    text: '⬅️ Back',
    callback_data: 'back_project_type'
  }]);
  
  return { inline_keyboard: keyboard };
};

export const handleMessage = async (ctx: Context) => {
  const userId = ctx.from?.id;
  const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : null;
  
  if (!userId || !messageText || messageText.startsWith('/')) {
    return;
  }

  const storage = StorageService.getInstance();
  const setupState = setupStates.get(userId);

  if (setupState) {
    await handleSetupStep(ctx, setupState);
  } else {
    await handleGeneralMessage(ctx);
  }
};

const handleSetupStep = async (ctx: Context, state: any) => {
  const userId = ctx.from?.id;
  const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : null;
  
  if (!userId || !messageText) return;

  try {
    // Categories and Project Type are now handled via buttons (callback queries)
    if (state.step === 'categories' || state.step === 'projectType') {
      await ctx.reply('Please use the buttons above to make your selection.');
    }
  } catch (error) {
    debug('Error in setup step:', error);
    await ctx.reply('❌ An error occurred. Please try /setup again.');
    setupStates.delete(userId);
  }
};







const handleBountyRangeSelection = async (ctx: any, state: any, callbackData: string) => {
  const rangeData = callbackData.replace('bounty_range_', '');
  const [minStr, maxStr] = rangeData.split('_');
  
  const minBounty = parseInt(minStr);
  const maxBounty = maxStr === 'none' ? undefined : parseInt(maxStr);
  
  state.data.minBounty = minBounty;
  state.data.maxBounty = maxBounty;
  
  // Proceed to categories step
  state.step = 'categories';
  
  const maxText = maxBounty ? `$${maxBounty}` : 'No maximum';
  const rangeName = BOUNTY_RANGES.find(range => range.min === minBounty && range.max === maxBounty)?.name || 'Custom Range';
  
  await ctx.reply(
    `✅ Bounty range set to: $${minBounty} \\- ${escapeMarkdownV2(maxText)} \\(${escapeMarkdownV2(rangeName)}\\)\n\n` +
    `*Step 2: Categories*\n` +
    `Which categories are you interested in?\n\n` +
    `Select categories from the buttons below:`,
    { 
      parse_mode: 'MarkdownV2',
      reply_markup: createCategoryKeyboard()
    }
  );
  
  await ctx.answerCbQuery(`Selected: ${rangeName}`);
};

const handleBackButton = async (ctx: any, state: any, callbackData: string) => {
  const backStep = callbackData.replace('back_', '');
  
  switch (backStep) {
    case 'categories':
      // Go back to bounty range
      state.step = 'bountyRange';
      await ctx.reply(
        `⬅️ *Back to Step 1: Bounty Range*\n\n` +
        `What bounty range are you interested in?\n\n` +
        `Select from the buttons below:`,
        { 
          parse_mode: 'MarkdownV2',
          reply_markup: createBountyRangeKeyboard()
        }
      );
      await ctx.answerCbQuery('Back to bounty range selection');
      break;
      
    case 'project_type':
      // Go back to categories
      state.step = 'categories';
      await ctx.reply(
        `⬅️ *Back to Step 2: Categories*\n\n` +
        `Which categories are you interested in?\n\n` +
        `Select categories from the buttons below:`,
        { 
          parse_mode: 'MarkdownV2',
          reply_markup: createCategoryKeyboard()
        }
      );
      await ctx.answerCbQuery('Back to category selection');
      break;
      
    default:
      await ctx.answerCbQuery('Invalid back action.');
  }
};

const handleGeneralMessage = async (ctx: Context) => {
  await ctx.reply(
    'Hi! I\'m a Superteam bounty notification bot. Use /help to see available commands or /setup to configure your preferences.'
  );
};

// Helper function to start setup process
export const startSetup = (userId: number) => {
  setupStates.set(userId, {
    step: 'bountyRange',
    data: {}
  });
};

// Export keyboard creation functions
export { createBountyRangeKeyboard, createCategoryKeyboard, createProjectTypeKeyboard };

// Handle callback queries (button clicks)
export const handleCallbackQuery = async (ctx: any) => {
  const userId = ctx.from?.id;
  const callbackData = ctx.callbackQuery?.data;
  
  if (!userId || !callbackData) {
    await ctx.answerCbQuery();
    return;
  }

  const setupState = setupStates.get(userId);
  
  if (!setupState) {
    await ctx.answerCbQuery('No active setup session. Use /setup to start.');
    return;
  }

  try {
    if (callbackData.startsWith('bounty_range_')) {
      await handleBountyRangeSelection(ctx, setupState, callbackData);
    } else if (callbackData.startsWith('category_')) {
      await handleCategorySelection(ctx, setupState, callbackData);
    } else if (callbackData.startsWith('project_type_')) {
      await handleProjectTypeSelection(ctx, setupState, callbackData);
    } else if (callbackData.startsWith('back_')) {
      await handleBackButton(ctx, setupState, callbackData);
    }
  } catch (error) {
    debug('Error in callback query:', error);
    await ctx.answerCbQuery('An error occurred. Please try again.');
  }
};

const handleCategorySelection = async (ctx: any, state: any, callbackData: string) => {
  const category = callbackData.replace('category_', '');
  
  if (!state.data.categories) {
    state.data.categories = [];
  }
  
  if (category === 'all') {
    state.data.categories = AVAILABLE_CATEGORIES;
  } else if (category === 'For You') {
    // "For You" is exclusive - clear other selections
    state.data.categories = ['For You'];
  } else if (category === 'All') {
    // "All" is exclusive - clear other selections
    state.data.categories = ['All'];
  } else if (!state.data.categories.includes(category)) {
    // Remove "For You" and "All" if selecting specific categories
    state.data.categories = state.data.categories.filter((cat: string) => cat !== 'For You' && cat !== 'All');
    state.data.categories.push(category);
  }
  
  // Automatically proceed to next step after category selection
  state.step = 'projectType';
  
  await ctx.reply(
    `✅ Categories set to: ${escapeMarkdownV2(state.data.categories.join(', '))}\n\n` +
    `*Step 3: Project Type*\n` +
    `What type of projects are you interested in?\n\n` +
    `Select from the buttons below:`,
    { 
      parse_mode: 'MarkdownV2',
      reply_markup: createProjectTypeKeyboard()
    }
  );
  
  await ctx.answerCbQuery(`Selected: ${category}`);
};

const handleProjectTypeSelection = async (ctx: any, state: any, callbackData: string) => {
  const projectType = callbackData.replace('project_type_', '');
  
  if (projectType !== 'bounties' && projectType !== 'projects') {
    await ctx.answerCbQuery('Invalid project type selected.');
    return;
  }
  
  state.data.projectType = projectType;
  
  // Complete the setup
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  
  if (!userId || !chatId) {
    await ctx.answerCbQuery('Error: Unable to identify user.');
    return;
  }
  
  const storage = StorageService.getInstance();
  
  state.data.userId = userId;
  state.data.chatId = chatId;
  state.data.isActive = true;
  state.data.createdAt = new Date();
  state.data.updatedAt = new Date();
  
  // Save user preferences
  await storage.saveUserPreferences(state.data as UserPreferences);
  
  // Clear setup state
  setupStates.delete(userId);
  
  const maxText = state.data.maxBounty ? `$${state.data.maxBounty}` : 'No maximum';
  
  const completionMessage = `🎉 *Setup Complete\\!*

Your preferences have been saved:

💰 *Bounty Range:* $${state.data.minBounty} \\- ${escapeMarkdownV2(maxText)}
📂 *Categories:* ${escapeMarkdownV2(state.data.categories.join(', '))}
🎯 *Project Type:* ${escapeMarkdownV2(projectType)}

You'll now receive notifications for new ${projectType} that match your preferences\\!

Use these commands:
• /preferences \\- View your settings
• /pause \\- Pause notifications
• /help \\- Show all commands`;
  
  await ctx.reply(completionMessage, { 
    parse_mode: 'MarkdownV2'
  });
  
  await ctx.answerCbQuery('Setup completed successfully!');
};

 