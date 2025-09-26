import { VercelRequest, VercelResponse } from '@vercel/node';
import { SubmissionReminderService } from '../../src/services/submission-reminder';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a Vercel cron job request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('📝 Starting submission reminders cron job...');
    
    const submissionReminderService = SubmissionReminderService.getInstance();
    
    // Check for new submissions and send notifications
    const sentCount = await submissionReminderService.checkAndSendSubmissionNotifications();
    
    console.log(`📝 Submission reminders cron job completed. Sent ${sentCount} notifications`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Submission reminders completed successfully',
      sentCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Submission reminders cron job failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
