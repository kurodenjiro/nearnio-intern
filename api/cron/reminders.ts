import { VercelRequest, VercelResponse } from '@vercel/node';
import { ReminderService } from '../../src/services/reminder';
import { DatabaseService } from '../../src/services/database';
import { escapeMarkdownV2 } from '../../src/utils/markdown';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a Vercel cron job request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('⏰ Starting reminders cron job...');
    
    const reminderService = ReminderService.getInstance();
    const databaseService = DatabaseService.getInstance();
    
    // Get all due reminders
    const dueReminders = await reminderService.getDueReminders();
    
    if (dueReminders.length === 0) {
      console.log('No due reminders found');
      res.status(200).json({ 
        success: true, 
        message: 'No due reminders found',
        sentCount: 0,
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.log(`Found ${dueReminders.length} due reminders`);

    let sentCount = 0;
    
    for (const reminder of dueReminders) {
      try {
        // Send reminder notification via Telegram Bot API directly
        const botToken = process.env.BOT_TOKEN;
        if (!botToken) {
          console.error('BOT_TOKEN not found in environment variables');
          continue;
        }

        // Get listing details for the reminder message
        const listing = await databaseService.getListingById(reminder.listingId);
        if (!listing) {
          console.error(`Listing ${reminder.listingId} not found for reminder`);
          continue;
        }

        // Calculate time left
        const timeLeft = reminderService.calculateTimeLeft(reminder.deadline);
        const isFinalReminder = reminderService.isFinalReminder(reminder.deadline);
        
        // Create reminder message
        let message = `⏰ *Deadline Reminder*\n\n`;
        message += `*${escapeMarkdownV2(listing.title)}*\n\n`;
        message += `📅 *Deadline:* ${escapeMarkdownV2(reminder.deadline.toString())}\n`;
        message += `⏱️ *Time Left:* ${escapeMarkdownV2(timeLeft)}\n\n`;
          
        if (isFinalReminder) {
          message += `🚨 *This is your final reminder\\!*\n`;
          message += `The submission deadline is very close\\.`;
        } else {
          message += `You'll receive more reminders as the deadline approaches\\.`;
        }

        // Create inline keyboard
        const keyboard = {
          inline_keyboard: [
            [
              {
                text: '🔗 View Details',
                url: `${process.env.SERVER_URL || 'https://nearn.io'}/${listing.sponsorSlug}/${listing.sequentialId}`
              }
            ],
            [
              {
                text: '🛑 Stop Reminders',
                callback_data: `stop_reminder_${listing.id}`
              }
            ]
          ]
        };

        const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: reminder.userId,
            text: message,
            parse_mode: 'MarkdownV2',
            reply_markup: keyboard
          })
        });

        if (telegramResponse.ok) {
          sentCount++;
          console.log(`Reminder sent to user ${reminder.userId} for listing ${reminder.listingId}`);
          
          // If this is the final reminder, deactivate it
          if (isFinalReminder) {
            await reminderService.removeReminder(reminder.userId, reminder.listingId);
            console.log(`Final reminder sent, deactivated reminder for user ${reminder.userId}, listing ${reminder.listingId}`);
          }
        } else {
          console.error(`Failed to send reminder to user ${reminder.userId}:`, await telegramResponse.text());
        }
        
        // Add a small delay between notifications
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error sending reminder notification for user ${reminder.userId}, listing ${reminder.listingId}:`, error);
      }
    }
    
    // Update last reminder check time
    await databaseService.setSystemConfig('last_reminder_check', new Date().toISOString());
    
    console.log(`Reminder check completed. Sent ${sentCount} reminder notifications`);
    
    console.log('✅ Reminders cron job completed successfully');
    res.status(200).json({ 
      success: true, 
      message: 'Reminders check completed successfully',
      sentCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Reminders cron job failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 