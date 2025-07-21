import { Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';

// Import all commands
import { start } from './commands/start';
import { setup } from './commands/setup';
import { preferences } from './commands/preferences';
import { help } from './commands/help';
import { pause } from './commands/pause';
import { resume } from './commands/resume';
import { stop } from './commands/stop';
import { stats } from './commands/stats';
import { edit } from './commands/edit';

// Import services
import { CronjobService } from './services/cronjob';
import { handleMessage, handleCallbackQuery } from './handlers/message-handler';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

const bot = new Telegraf(BOT_TOKEN);

// Register all commands
bot.command('start', start());
bot.command('setup', setup());
bot.command('preferences', preferences());
bot.command('help', help());
bot.command('pause', pause());
bot.command('resume', resume());
bot.command('stop', stop());
bot.command('stats', stats());
bot.command('edit', edit());

// Handle unknown commands
bot.command('about', async (ctx) => {
  await ctx.reply('This bot has been updated to Superteam Bounty Notifications. Use /help to see available commands.');
});

// Handle text messages
bot.on('message', async (ctx) => {
  await handleMessage(ctx);
});

// Handle callback queries (button clicks)
bot.on('callback_query', async (ctx) => {
  await handleCallbackQuery(ctx);
});

// Initialize cronjob service (only for manual operations)
const cronjobService = CronjobService.getInstance();
cronjobService.setBot(bot);

// Production mode (Vercel)
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};

// Development mode
if (ENVIRONMENT !== 'production') {
  development(bot);
}
