import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      vercelUrl: process.env.VERCEL_URL || 'not set',
      botToken: process.env.BOT_TOKEN ? 'set' : 'not set',
      cronSecret: process.env.CRON_SECRET ? 'set' : 'not set',
      databaseUrl: process.env.DATABASE_URL ? 'set' : 'not set'
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 