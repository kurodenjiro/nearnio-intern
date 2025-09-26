import { DatabaseService } from '../src/services/database';
import { SuperteamApiService } from '../src/services/superteam-api';

async function debugSyncDetailed() {
  console.log('🔍 Detailed Database Sync Debug...\n');

  try {
    const databaseService = DatabaseService.getInstance();
    const apiService = SuperteamApiService.getInstance();

    console.log('1️⃣ Fetching listings from API...');
    const listings = await apiService.fetchListings('all', ['All']);
    console.log(`   📊 Found ${listings.length} listings`);

    console.log('\n2️⃣ Testing individual listing sync...');
    
    // Test with just one listing
    const testListing = listings[0];
    console.log(`   Testing with: ${testListing.title}`);
    console.log(`   - ID: ${testListing.id}`);
    console.log(`   - Reward: ${testListing.rewardAmount}`);
    console.log(`   - Token: ${testListing.token}`);
    console.log(`   - Slug: ${testListing.slug}`);

    try {
      console.log('\n3️⃣ Attempting to sync single listing...');
      const syncedCount = await databaseService.syncListings([testListing]);
      console.log(`   ✅ Synced ${syncedCount} listings`);
    } catch (error) {
      console.error('   ❌ Single listing sync failed:', error);
      console.error('   Error details:', (error as Error).message);
      console.error('   Stack trace:', (error as Error).stack);
    }

    console.log('\n4️⃣ Checking database contents after sync...');
    try {
      const allListings = await databaseService.getListingsByFilters('all', ['All'], 0);
      console.log(`   📊 Found ${allListings.length} listings in database`);
      
      if (allListings.length > 0) {
        allListings.forEach((listing, index) => {
          console.log(`   ${index + 1}. ${listing.title} (USD: ${listing.usdAmount})`);
        });
      }
    } catch (error) {
      console.error('   ❌ Database query failed:', error);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Error details:', (error as Error).message);
    console.error('Stack trace:', (error as Error).stack);
  }
}

debugSyncDetailed();
