import { VercelRequest, VercelResponse } from '@vercel/node';
import { SuperteamApiService } from '../../src/services/superteam-api';
import { DatabaseService } from '../../src/services/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a Vercel cron job request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔄 Starting sync cron job...');
    
    const apiService = SuperteamApiService.getInstance();
    const databaseService = DatabaseService.getInstance();
    
    let totalSynced = 0;
    
    // Fetch and sync listings using "all" tab and "All" category
    try {
      console.log('Fetching all listings from Superteam API');
      
      const listings = await apiService.fetchListings('all', ['All']);
      
      if (listings.length > 0) {
        const syncedCount = await databaseService.syncListings(listings);
        totalSynced += syncedCount;
        console.log(`Synced ${syncedCount} listings`);
      }
      
    } catch (error) {
      console.error('Error syncing listings:', error);
    }
    
    // Update last sync time
    await databaseService.setSystemConfig('last_sync_time', new Date().toISOString());
    
    console.log(`API data sync completed. Total synced: ${totalSynced} listings`);
    
    console.log('✅ Sync cron job completed successfully');
    res.status(200).json({ 
      success: true, 
      message: 'Sync completed successfully',
      totalSynced,
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