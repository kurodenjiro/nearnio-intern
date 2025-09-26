import { DatabaseService } from '../src/services/database';
import { SuperteamApiService } from '../src/services/superteam-api';

async function debugSync() {
  console.log('🔍 Debugging Database Sync Process...\n');

  try {
    const databaseService = DatabaseService.getInstance();
    const apiService = SuperteamApiService.getInstance();

    console.log('1️⃣ Fetching listings from API...');
    const listings = await apiService.fetchListings('all', ['All']);
    console.log(`   📊 Found ${listings.length} listings`);
    
    // Show details of each listing
    listings.forEach((listing, index) => {
      console.log(`   ${index + 1}. ${listing.title}`);
      console.log(`      - ID: ${listing.id}`);
      console.log(`      - Reward: ${listing.rewardAmount}`);
      console.log(`      - Token: ${listing.token}`);
      console.log(`      - Type: ${listing.type}`);
      console.log(`      - Slug: ${listing.slug}`);
    });

    console.log('\n2️⃣ Attempting to sync to database...');
    try {
      const syncedCount = await databaseService.syncListings(listings);
      console.log(`   ✅ Synced ${syncedCount} listings`);
    } catch (error) {
      console.error('   ❌ Sync failed:', error);
    }

    console.log('\n3️⃣ Checking database contents...');
    try {
      const allListings = await databaseService.getListingsByFilters('all', ['All'], 0);
      console.log(`   📊 Found ${allListings.length} listings in database`);
      
      allListings.forEach((listing, index) => {
        console.log(`   ${index + 1}. ${listing.title} (USD: ${listing.usdAmount})`);
      });
    } catch (error) {
      console.error('   ❌ Database query failed:', error);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugSync();
