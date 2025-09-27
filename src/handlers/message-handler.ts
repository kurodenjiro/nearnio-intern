import { Context } from 'telegraf';
import createDebug from 'debug';
import { DatabaseService } from '../services/database';
import { UserPreferences } from '../types/superteam';
import { escapeMarkdownV2 } from '../utils/markdown';
import { ReminderService } from '../services/reminder';
import { SubmissionReminderService } from '../services/submission-reminder';
import { ChatAIService } from '../services/chat-ai';
import { stats } from '../commands/stats';
import { preferences } from '../commands/preferences';
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';

const debug = createDebug('bot:message-handler');

// Category mapping function to convert user-friendly names to internal format
const mapUserCategoryToInternal = (userCategory: string): string => {
  const categoryMap: Record<string, string> = {
    'Development': 'DEV',
    'Design': 'DESIGN',
    'Content': 'CONTENT',
    'Growth': 'GROWTH',
    'Community': 'COMMUNITY',
    
    'Other': 'OTHER',
    'All': 'All'
  };
  
  return categoryMap[userCategory] || userCategory;
};

// Reverse mapping function to convert internal format to user-friendly names
const mapInternalCategoryToUser = (internalCategory: string): string => {
  const reverseMap: Record<string, string> = {
    'DEV': 'Development',
    'DESIGN': 'Design',
    'CONTENT': 'Content',
    'GROWTH': 'Growth',
    'COMMUNITY': 'Community',
    
    'OTHER': 'Other',
    'All': 'All'
  };
  
  return reverseMap[internalCategory] || internalCategory;
};

// Simple in-memory state management for setup process
const setupStates = new Map<number, {
  step: 'bountyRange' | 'categories' | 'projectType' | 'complete';
  data: Partial<UserPreferences>;
}>();

// Available categories and project types
const AVAILABLE_CATEGORIES = [
  'All', 'Content', 'Design', 'Development', 'Other'
];

const PROJECT_TYPES = ['bounty', 'project', 'sponsorship', 'all'];

// Bounty range options
const BOUNTY_RANGES = [
  { text: '0-50$', min: 0, max: 50, name: 'Micro Bounties' },
  { text: '50$-100$', min: 51, max: 100, name: 'Small Bounties' },
  { text: '100$-250$', min: 101, max: 250, name: 'Medium Bounties' },
  { text: '250$-500$', min: 251, max: 500, name: 'Large Bounties' },
  { text: '500$-1000$', min: 501, max: 1000, name: 'Premium Bounties' },
  { text: '>1000$', min: 1001, max: undefined, name: 'Enterprise Bounties' }
];

// Minimum bounty options (no maximum)
const MIN_BOUNTY_RANGES = [
  { text: '0$+', min: 0, max: undefined, name: 'Any Amount' },
  { text: '100$+', min: 100, max: undefined, name: '100$ Minimum' },
  { text: '250$+', min: 250, max: undefined, name: '250$ Minimum' },
  { text: '500$+', min: 500, max: undefined, name: '500$ Minimum' }
];

// Helper function to create category selection keyboard
const createCategoryKeyboard = (): InlineKeyboardMarkup => {
  const keyboard = [];
  
  // First row: All (exclusive option)
  keyboard.push([
    { text: 'All', callback_data: 'category_All' }
  ]);
  
  // Second row: Content and Design
  keyboard.push([
    { text: 'Content', callback_data: 'category_Content' },
    { text: 'Design', callback_data: 'category_Design' }
  ]);
  
  // Third row: Development
  keyboard.push([
    { text: 'Development', callback_data: 'category_Development' }
  ]);
  
  // Fourth row: Other
  keyboard.push([
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
  const keyboard = [];
  
  // Add bounty range options in rows of 2
  for (let i = 0; i < BOUNTY_RANGES.length; i += 2) {
    const row = [];
    row.push({
      text: `💵 ${BOUNTY_RANGES[i].text}`,
      callback_data: `bounty_${BOUNTY_RANGES[i].min}_${BOUNTY_RANGES[i].max || 'unlimited'}`
    });
    
    if (i + 1 < BOUNTY_RANGES.length) {
      row.push({
        text: `💵 ${BOUNTY_RANGES[i + 1].text}`,
        callback_data: `bounty_${BOUNTY_RANGES[i + 1].min}_${BOUNTY_RANGES[i + 1].max || 'unlimited'}`
      });
    }
    keyboard.push(row);
  }
  
  // Add minimum bounty options in rows of 2
  for (let i = 0; i < MIN_BOUNTY_RANGES.length; i += 2) {
    const row = [];
    row.push({
      text: `🎯 ${MIN_BOUNTY_RANGES[i].text}`,
      callback_data: `min_bounty_${MIN_BOUNTY_RANGES[i].min}`
    });
    
    if (i + 1 < MIN_BOUNTY_RANGES.length) {
      row.push({
        text: `🎯 ${MIN_BOUNTY_RANGES[i + 1].text}`,
        callback_data: `min_bounty_${MIN_BOUNTY_RANGES[i + 1].min}`
      });
    }
    keyboard.push(row);
  }
  
  return { inline_keyboard: keyboard };
};

// Helper function to create project type selection keyboard
const createProjectTypeKeyboard = (): InlineKeyboardMarkup => {
  const keyboard = [];
  
  // Project type options
  keyboard.push([
    { text: 'Bounty', callback_data: 'project_type_bounty' },
    { text: 'Project', callback_data: 'project_type_project' }
  ]);
  
  keyboard.push([
    { text: 'Sponsorship', callback_data: 'project_type_sponsorship' }
  ]);
  
  keyboard.push([
    { text: 'All', callback_data: 'project_type_all' }
  ]);
  
  // Add back button
  keyboard.push([{
    text: '⬅️ Back',
    callback_data: 'back_project_type'
  }]);
  
  return { inline_keyboard: keyboard };
};
export const handleCallbackQuery = async (ctx: any) => {
  try {
    const callbackData = ctx.callbackQuery.data;
    const userId = ctx.from?.id;
    
    if (!userId) {
      await ctx.answerCbQuery('Unable to identify user. Please try again.');
      return;
    }

    debug('Handling callback query:', callbackData);

    // Handle reminder-related callbacks outside of setup state
    if (callbackData.startsWith('add_reminder_')) {
      await handleAddReminder(ctx, callbackData);
      return;
    }

    if (callbackData.startsWith('stop_reminder_')) {
      await handleStopReminder(ctx, callbackData);
      return;
    }

    if (callbackData.startsWith('add_submission_reminder_')) {
      await handleAddSubmissionReminder(ctx, callbackData);
      return;
    }

    if (callbackData.startsWith('stop_submission_reminder_')) {
      await handleStopSubmissionReminder(ctx, callbackData);
      return;
    }

    if (callbackData.startsWith('chat_ai_')) {
      await handleChatAI(ctx, callbackData);
      return;
    }
    // Get or create setup state for this user
    let state = setupStates.get(userId);
    if (!state) {
      state = {
        step: 'bountyRange',
        data: {}
      };
      setupStates.set(userId, state);
    }

    // Handle different callback types
    if (callbackData.startsWith('bounty_')) {
      await handleBountyRangeSelection(ctx, state, callbackData);
    } else if (callbackData.startsWith('min_bounty_')) {
      await handleMinBountySelection(ctx, state, callbackData);
    } else if (callbackData.startsWith('category_')) {
      await handleCategorySelection(ctx, state, callbackData);
    } else if (callbackData.startsWith('project_type_')) {
      await handleProjectTypeSelection(ctx, state, callbackData);
    } else if (callbackData === 'back_categories') {
      await handleBackToCategories(ctx, state);
    } else if (callbackData === 'back_project_type') {
      await handleBackToProjectType(ctx, state);
    } else if (callbackData === 'view_stats') {
      await stats()(ctx);
    } else if (callbackData === 'view_preferences') {
      await preferences()(ctx);
    } else {
      await ctx.answerCbQuery('Unknown action. Please try again.');
    }

  } catch (error) {
    debug('Error in callback query handler:', error);
    await ctx.answerCbQuery('An error occurred. Please try again.');
  }
};

const handleCategorySelection = async (ctx: any, state: any, callbackData: string) => {
  const userCategory = callbackData.replace('category_', '');
  const internalCategory = mapUserCategoryToInternal(userCategory);
  
  if (!state.data.categories) {
    state.data.categories = [];
  }
  
  if (userCategory === 'all') {
    state.data.categories = AVAILABLE_CATEGORIES.map(cat => mapUserCategoryToInternal(cat));
  } else if (userCategory === 'All') {
    // "All" is exclusive - clear other selections
    state.data.categories = ['All'];
  } else if (!state.data.categories.includes(internalCategory)) {
    // Remove "All" if selecting specific categories
    state.data.categories = state.data.categories.filter((cat: string) => cat !== 'All');
    state.data.categories.push(internalCategory);
  }
  
  // Automatically proceed to next step after category selection
  state.step = 'projectType';
  
  await ctx.editMessageText(
    `✅ Categories set to: ${escapeMarkdownV2(state.data.categories.map((cat: string) => mapInternalCategoryToUser(cat)).join(', '))}\n\n` +
    `*Step 3: Project Type*\n` +
    `What type of projects are you interested in?\n\n` +
    `Select from the buttons below:`,
    { 
      parse_mode: 'MarkdownV2',
      reply_markup: createProjectTypeKeyboard()
    }
  );
  
  await ctx.answerCbQuery(`Selected: ${userCategory}`);
};

const handleProjectTypeSelection = async (ctx: any, state: any, callbackData: string) => {
  const userId = ctx.from?.id;
  const projectType = callbackData.replace('project_type_', '');
  
  state.data.projectType = projectType;
  state.step = 'complete';
  
  // Save preferences to database
  const databaseService = DatabaseService.getInstance();
  await databaseService.saveUserPreferences({
    userId: userId,
    chatId: ctx.chat?.id || userId,
    categories: state.data.categories || ['All'],
    minBounty: state.data.minBounty || 0,
    maxBounty: state.data.maxBounty,
    projectType: projectType,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Clear setup state
  setupStates.delete(userId);
  
  const categoriesText = state.data.categories?.map((cat: string) => mapInternalCategoryToUser(cat)).join(', ') || 'All';
  const bountyText = state.data.maxBounty 
    ? `$${state.data.minBounty}-$${state.data.maxBounty}`
    : `$${state.data.minBounty}+`;
  
  await ctx.reply(
    `🎉 *Setup Complete\\!*\n\n` +
    `*Your preferences:*\n` +
    `💰 *Bounty Range:* ${escapeMarkdownV2(bountyText)}\n` +
    `🔖 *Categories:* ${escapeMarkdownV2(categoriesText)}\n` +
    `🎯 *Project Type:* ${escapeMarkdownV2(projectType.charAt(0).toUpperCase() + projectType.slice(1))}\n\n` +
    `You'll now receive notifications for new bounties that match your preferences\\.\n\n` +
    `Use /preferences to view your settings or /edit to modify them\\.`,
    { 
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 View Stats', callback_data: 'view_stats' }],
          [{ text: '⚙️ Preferences', callback_data: 'view_preferences' }]
        ]
      }
    }
  );
  
  await ctx.answerCbQuery(`Setup completed!`);
};

const handleBountyRangeSelection = async (ctx: any, state: any, callbackData: string) => {
  const [_, minStr, maxStr] = callbackData.split('_');
  const min = parseInt(minStr);
  const max = maxStr === 'unlimited' ? undefined : parseInt(maxStr);
  
  state.data.minBounty = min;
  state.data.maxBounty = max;
  state.step = 'categories';
  
  const rangeText = max ? `$${min}-$${max}` : `$${min}+`;
  
  await ctx.editMessageText(
    `✅ Bounty range set to: ${escapeMarkdownV2(rangeText)}\n\n` +
    `*Step 2: Categories*\n` +
    `What categories are you interested in?\n\n` +
    `Select from the buttons below:`,
    { 
      parse_mode: 'MarkdownV2',
      reply_markup: createCategoryKeyboard()
    }
  );
  
  await ctx.answerCbQuery(`Selected: ${rangeText}`);
};

const handleMinBountySelection = async (ctx: any, state: any, callbackData: string) => {
  const min = parseInt(callbackData.replace('min_bounty_', ''));
  
  state.data.minBounty = min;
  state.data.maxBounty = undefined;
  state.step = 'categories';
  
  const rangeText = `$${min}+`;
  
  await ctx.editMessageText(
    `✅ Minimum bounty set to: ${escapeMarkdownV2(rangeText)}\n\n` +
    `*Step 2: Categories*\n` +
    `What categories are you interested in?\n\n` +
    `Select from the buttons below:`,
    { 
      parse_mode: 'MarkdownV2',
      reply_markup: createCategoryKeyboard()
    }
  );
  
  await ctx.answerCbQuery(`Selected: ${rangeText}`);
};

const handleBackToCategories = async (ctx: any, state: any) => {
  state.step = 'bountyRange';
  
  await ctx.editMessageText(
    `*Step 1: Bounty Range*\n` +
    `What's your preferred bounty range?\n\n` +
    `Select from the buttons below:`,
    { 
      parse_mode: 'MarkdownV2',
      reply_markup: createBountyRangeKeyboard()
    }
  );
  
  await ctx.answerCbQuery('Back to bounty range');
};

const handleBackToBountyRange = async (ctx: any, state: any) => {
  state.step = 'bountyRange';
  
  await ctx.editMessageText(
    `*Step 1: Bounty Range*\n` +
    `What's your preferred bounty range?\n\n` +
    `Select from the buttons below:`,
    { 
      parse_mode: 'MarkdownV2',
      reply_markup: createBountyRangeKeyboard()
    }
  );
  
  await ctx.answerCbQuery('Back to bounty range');
};

const handleBackToProjectType = async (ctx: any, state: any) => {
  state.step = 'categories';
  
  await ctx.editMessageText(
    `*Step 2: Categories*\n` +
    `What categories are you interested in?\n\n` +
    `Select from the buttons below:`,
    { 
      parse_mode: 'MarkdownV2',
      reply_markup: createCategoryKeyboard()
    }
  );
  
  await ctx.answerCbQuery('Back to categories');
};

// Reminder handling functions
const handleAddReminder = async (ctx: any, callbackData: string) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) return;

    const listingId = parseInt(callbackData.replace('add_reminder_', ''));
    const databaseService = DatabaseService.getInstance();
    const reminderService = ReminderService.getInstance();

    // Get listing details
    const listing = await databaseService.getListingById(listingId);
    if (!listing) {
      await ctx.answerCbQuery('❌ Listing not found');
      return;
    }

    // Check if user already has a reminder for this listing
    const hasActiveReminder = await reminderService.hasActiveReminder(userId, listingId);
    if (hasActiveReminder) {
      await ctx.reply(
        `⏰ *Reminder Already Set*\n\n` +
        `*${escapeMarkdownV2(listing.title)}*\n\n` +
        `You already have an active reminder for this listing\\.\n\n` +
        `📅 *Deadline:* ${escapeMarkdownV2(new Date(listing.deadline).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        }))}\n\n` +
        `You'll be notified as the deadline approaches\\.`,
        { 
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔗 View Details', url: `${process.env.SERVER_URL || 'https://nearn.io'}/${listing.sponsorSlug}/${listing.sequentialId}` }],
              [{ text: '🛑 Stop Reminders', callback_data: `stop_reminder_${listingId}` }]
            ]
          }
        }
      );
      await ctx.answerCbQuery('Reminder already set');
      return;
    }

    // Add reminder
    const success = await reminderService.addReminder(userId, listingId, listing.slug, listing.title, new Date(listing.deadline));
    if (success) {
      const formattedDeadline = new Date(listing.deadline).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      await ctx.reply(
        `✅ *Reminder Set "${escapeMarkdownV2(listing.title)}" Successfully\\!*\n\n` +
        `📅 *Deadline:* ${escapeMarkdownV2(formattedDeadline)}\n\n` +
        `You'll be notified as the deadline approaches\\.`,
        { 
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔗 View Details', url: `${process.env.SERVER_URL || 'https://nearn.io'}/${listing.sponsorSlug}/${listing.sequentialId}` }],
              [{ text: '🛑 Stop Reminders', callback_data: `stop_reminder_${listingId}` }]
            ]
          }
        }
      );
      await ctx.answerCbQuery('✅ Reminder set successfully!');
    } else {
      await ctx.answerCbQuery('❌ Failed to set reminder');
    }
  } catch (error) {
    debug('Error adding reminder:', error);
    await ctx.answerCbQuery('❌ Error setting reminder');
  }
};

const handleStopReminder = async (ctx: any, callbackData: string) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) return;

    const listingId = parseInt(callbackData.replace('stop_reminder_', ''));
    const databaseService = DatabaseService.getInstance();
    const reminderService = ReminderService.getInstance();

    // Get listing details
    const listing = await databaseService.getListingById(listingId);
    if (!listing) {
      await ctx.answerCbQuery('❌ Listing not found');
      return;
    }

    // Remove reminder
    const success = await reminderService.removeReminder(userId, listingId);
    if (success) {
      await ctx.reply(
        `🛑 *Reminders Stopped*\n\n` +
        `✅ You will no longer receive deadline reminders for this listing\\.\n\n` +
        `To set a new reminder, click the "⏰ Remind Deadline" button on any listing notification\\.`,
        { 
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔗 View Details', url: `${process.env.SERVER_URL || 'https://nearn.io'}/${listing.sponsorSlug}/${listing.sequentialId}` }]
            ]
          }
        }
      );
      await ctx.answerCbQuery('✅ Reminders stopped');
    } else {
      await ctx.answerCbQuery('❌ Failed to stop reminders');
    }
  } catch (error) {
    debug('Error stopping reminder:', error);
    await ctx.answerCbQuery('❌ Error stopping reminders');
  }
};

// Export additional functions needed by setup command
export const startSetup = async (ctx: Context) => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('❌ Unable to identify user. Please try again.');
    return;
  }

  // Initialize setup state
  const state = {
    step: 'bountyRange' as const,
    data: {} as Partial<UserPreferences>
  };
  setupStates.set(userId, state);

  await ctx.reply(
    `*Step 1: Bounty Range*\n` +
    `What's your preferred bounty range?\n\n` +
    `Select from the buttons below:`,
    { 
      parse_mode: 'MarkdownV2',
      reply_markup: createBountyRangeKeyboard()
    }
  );
};


export const handleMessage = async (ctx: Context) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) return;

    const chatAIService = ChatAIService.getInstance();
    
    // Check if user has an active chat session
    const isActive = await chatAIService.isChatActive(userId);
    
    if (isActive) {
      // Process the message as a chat message
      const result = await chatAIService.processMessage(userId, ctx.message && 'text' in ctx.message ? ctx.message.text : '');
      
      if (result.success) {
        await ctx.reply(result.response, { parse_mode: 'MarkdownV2' });
      } else {
        await ctx.reply(result.response);
      }
    } else {
      // Handle as regular message
      await ctx.reply('Please use the /setup command to configure your preferences.');
    }
  } catch (error) {
    debug('Error handling message:', error);
    await ctx.reply('An error occurred while processing your message.');
  }
};
export { createBountyRangeKeyboard, createCategoryKeyboard, createProjectTypeKeyboard };


// Add submission reminder handlers
const handleAddSubmissionReminder = async (ctx: any, callbackData: string) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) return;

    const listingId = parseInt(callbackData.replace('add_submission_reminder_', ''));
    const databaseService = DatabaseService.getInstance();
    const submissionReminderService = SubmissionReminderService.getInstance();

    // Get listing details
    const listing = await databaseService.getListingById(listingId);
    if (!listing) {
      await ctx.answerCbQuery('❌ Listing not found');
      return;
    }

    // Check if user already has a submission reminder for this listing
    const hasActiveReminder = await submissionReminderService.hasActiveSubmissionReminder(userId, listingId);
    if (hasActiveReminder) {
      await ctx.reply(
        `📝 *Submission Reminder Already Set*\n\n` +
        `*${escapeMarkdownV2(listing.title)}*\n\n` +
        `You already have an active submission reminder for this listing\\.\n\n` +
        `You'll be notified when new submissions are created or approved\\.`,
        { 
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📝 View Details', url: `${process.env.SERVER_URL || 'https://nearn.io'}/${listing.sponsorSlug}/${listing.sequentialId}` }],
              [{ text: '🛑 Stop Submission Reminders', callback_data: `stop_submission_reminder_${listingId}` }]
            ]
          }
        }
      );
      await ctx.answerCbQuery('Submission reminder already set');
      return;
    }

    // Add submission reminder
    const success = await submissionReminderService.addSubmissionReminder(
      userId, 
      listingId, 
      listing.slug, 
      listing.title,
      listing.sponsorSlug,
      listing.sequentialId
    );
    
    if (success) {
      await ctx.reply(
        `✅ *Submission Reminder Set "${escapeMarkdownV2(listing.title)}" Successfully\\!*\n\n` +
        `You'll be notified when:\n` +
        `• New submissions are created\n` +
        `• Submission status changes to approved\n\n` +
        `🔗 [View Details](${process.env.SERVER_URL || 'https://nearn.io'}/${listing.sponsorSlug}/${listing.sequentialId})`,
        { 
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛑 Stop Submission Reminders', callback_data: `stop_submission_reminder_${listingId}` }]
            ]
          }
        }
      );
      await ctx.answerCbQuery('✅ Submission reminder set successfully!');
    } else {
      await ctx.answerCbQuery('❌ Failed to set submission reminder');
    }
  } catch (error) {
    debug('Error adding submission reminder:', error);
    await ctx.answerCbQuery('❌ Error setting submission reminder');
  }
};

const handleStopSubmissionReminder = async (ctx: any, callbackData: string) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) return;

    const listingId = parseInt(callbackData.replace('stop_submission_reminder_', ''));
    const submissionReminderService = SubmissionReminderService.getInstance();

    // Remove submission reminder
    const success = await submissionReminderService.removeSubmissionReminder(userId, listingId);
    if (success) {
      await ctx.reply(
        `🛑 *Submission Reminders Stopped*\n\n` +
        `✅ You will no longer receive submission reminders for this listing\\.\n\n` +
        `To set a new submission reminder, click the "📝 Remind Submission" button on any listing notification\\.`,
        { 
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
            ]
          }
        }
      );
      await ctx.answerCbQuery('✅ Submission reminders stopped');
    } else {
      await ctx.answerCbQuery('❌ Failed to stop submission reminders');
    }
  } catch (error) {
    debug('Error stopping submission reminder:', error);
    await ctx.answerCbQuery('❌ Error stopping submission reminders');
  }
};

const handleChatAI = async (ctx: any, callbackData: string) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) return;

    const listingId = parseInt(callbackData.replace('chat_ai_', ''));
    const chatAIService = ChatAIService.getInstance();

    // Start chat session
    const result = await chatAIService.startChatSession(userId, listingId);
    
    if (result.success) {
      await ctx.reply(
        escapeMarkdownV2(result.message),
        { parse_mode: 'MarkdownV2' }
      );
      await ctx.answerCbQuery('✅ Chat AI session started');
    } else {
      await ctx.reply(
        `❌ ${escapeMarkdownV2(result.message)}`,
        { parse_mode: 'MarkdownV2' }
      );
      await ctx.answerCbQuery('❌ Failed to start chat session');
    }
  } catch (error) {
    debug('Error starting chat AI:', error);
    await ctx.answerCbQuery('❌ Error starting chat session');
  }
};
