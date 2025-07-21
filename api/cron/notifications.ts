import { VercelRequest, VercelResponse } from '@vercel/node';
import { DatabaseService } from '../../src/services/database';
import { NotificationService } from '../../src/services/notification';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a Vercel cron job request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('📢 Starting notifications cron job...');
    
    const databaseService = DatabaseService.getInstance();
    const notificationService = NotificationService.getInstance();

    // Get all active users
    const activeUsers = await databaseService.getAllActiveUsers();
    
    if (activeUsers.length === 0) {
      console.log('No active users found, skipping notification check');
      res.status(200).json({ 
        success: true, 
        message: 'No active users found',
        notificationCount: 0,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get last notification check time
    const lastCheckTimeStr = await databaseService.getSystemConfig('last_notification_check');
    const lastCheckTime = lastCheckTimeStr ? new Date(lastCheckTimeStr) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago
    
    // Get new listings since last check
    const newListings = await databaseService.getNewListings(lastCheckTime);
    
    if (newListings.length === 0) {
      console.log('No new listings found since last check');
    }

    console.log(`Found ${newListings.length} new listings, processing notifications`);

    let notificationCount = 0;
    
    // Process each user
    for (const user of activeUsers) {
      try {
        
        // Get listings that match user preferences
        const matchingListings = await databaseService.getListingsByFilters(
          user.projectType,
          user.categories,
          user.minBounty,
          user.maxBounty,
          lastCheckTime
        );

        if (matchingListings.length > 0) {
          // Send notifications for matching listings
          for (const listing of matchingListings) {
            // Check if notification has already been sent to this user for this listing
            const existingNotification = await databaseService.getNotificationLog(user.userId, listing.id);
            if (existingNotification) {
              console.log(`Notification already sent to user ${user.userId} for listing ${listing.id}, skipping`);
              continue;
            }
            
            try {
              const { text, keyboard } = await notificationService.createListingMessage(listing, user.userId);
              
              // Send notification via Telegram Bot API directly
              const botToken = process.env.BOT_TOKEN;
              if (!botToken) {
                console.error('BOT_TOKEN not found in environment variables');
                continue;
              }

              const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chat_id: user.userId,
                  text: text,
                  parse_mode: 'MarkdownV2',
                  reply_markup: keyboard
                })
              });

              if (telegramResponse.ok) {
                // Log the notification
                await databaseService.logNotification(user.userId, listing.id, true);
                notificationCount++;
                console.log(`Notification sent to user ${user.userId} for listing ${listing.id}`);
              } else {
                console.error(`Failed to send notification to user ${user.userId}:`, await telegramResponse.text());
              }
              
              // Add a small delay between notifications
              await new Promise(resolve => setTimeout(resolve, 100));
              
            } catch (error) {
              console.error(`Error sending notification to user ${user.userId} for listing ${listing.id}:`, error);
            }
          }
        }
        
      } catch (error) {
        console.error(`Error processing user ${user.userId}:`, error);
      }
    }
    
    // Update last notification check time
    await databaseService.setSystemConfig('last_notification_check', new Date().toISOString());
    
    console.log(`Notification check completed. Sent ${notificationCount} notifications`);
    
    console.log('✅ Notifications cron job completed successfully');
    res.status(200).json({ 
      success: true, 
      message: 'Notifications check completed successfully',
      notificationCount,
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