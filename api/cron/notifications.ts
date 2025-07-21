import { VercelRequest, VercelResponse } from '@vercel/node';
import { CronjobService } from '../../src/services/cronjob';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a Vercel cron job request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('📢 Starting notifications cron job...');
    
    const cronjobService = CronjobService.getInstance();
    await cronjobService.sendNotificationsFromDatabase();
    
    console.log('✅ Notifications cron job completed successfully');
    res.status(200).json({ 
      success: true, 
      message: 'Notifications check completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Notifications cron job failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 