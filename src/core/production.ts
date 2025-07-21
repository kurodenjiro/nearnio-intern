import { VercelRequest, VercelResponse } from '@vercel/node';
import createDebug from 'debug';
import { Context, Telegraf } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';

const debug = createDebug('bot:dev');

const PORT = (process.env.PORT && parseInt(process.env.PORT, 10)) || 3000;
const VERCEL_URL = `${process.env.VERCEL_URL}`;

const production = async (
  req: VercelRequest,
  res: VercelResponse,
  bot: Telegraf<Context<Update>>,
) => {
  try {
    debug('Bot runs in production mode');
    debug(`VERCEL_URL: ${VERCEL_URL}`);
    debug(`Request method: ${req.method}`);
    debug(`Request path: ${req.url}`);

    if (!VERCEL_URL) {
      throw new Error('VERCEL_URL is not set.');
    }

    if (!process.env.BOT_TOKEN) {
      throw new Error('BOT_TOKEN is not set.');
    }

    // Set up webhook only on GET requests (initialization)
    if (req.method === 'GET') {
      const getWebhookInfo = await bot.telegram.getWebhookInfo();
      const webhookUrl = `${VERCEL_URL}/api`;
      debug(`Current webhook URL: ${getWebhookInfo.url}`);
      debug(`Target webhook URL: ${webhookUrl}`);
      
      if (getWebhookInfo.url !== webhookUrl) {
        debug(`deleting webhook ${getWebhookInfo.url}`);
        await bot.telegram.deleteWebhook();
        debug(`setting webhook: ${webhookUrl}`);
        await bot.telegram.setWebhook(webhookUrl);
        debug('Webhook set successfully');
      } else {
        debug('Webhook already set correctly');
      }
      
      res.status(200).json({
        status: 'Bot is running',
        webhook: webhookUrl,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Handle POST requests (Telegram updates)
    if (req.method === 'POST') {
      debug('Handling Telegram update');
      await bot.handleUpdate(req.body as unknown as Update, res);
      debug('Telegram update handled successfully');
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    debug('Error in production mode:', error);
    console.error('Production error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
export { production };
