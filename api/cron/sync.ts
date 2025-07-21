import { VercelRequest, VercelResponse } from '@vercel/node';
import { CronjobService } from '../../src/services/cronjob';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a Vercel cron job request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔄 Starting sync cron job...');
    
    const cronjobService = CronjobService.getInstance();
    await cronjobService.syncApiDataToDatabase();
    
    console.log('✅ Sync cron job completed successfully');
    res.status(200).json({ 
      success: true, 
      message: 'Sync completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Sync cron job failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 