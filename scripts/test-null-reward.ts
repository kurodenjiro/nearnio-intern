import { DatabaseService } from '../src/services/database';
import { SuperteamApiService } from '../src/services/superteam-api';

async function testNullRewardHandling() {
  console.log('🧪 Testing Null Reward Amount Handling...\n');

  try {
    const databaseService = DatabaseService.getInstance();
    const apiService = SuperteamApiService.getInstance();

    console.log('1️⃣ Fetching mock data with null reward amounts...');
    const listings = await apiService.fetchListings('all', ['All']);
    
    console.log(`   📊 Found ${listings.length} listings`);
    
    // Find listings with null reward amounts
    const nullRewardListings = listings.filter(l => l.rewardAmount === null);
    console.log(`   🔍 Found ${nullRewardListings.length} listings with null reward amounts`);
    
    if (nullRewardListings.length > 0) {
      console.log('   📋 Null reward listings:');
      nullRewardListings.forEach((listing, index) => {
        console.log(`      ${index + 1}. ${listing.title} (${listing.token})`);
      });
    }

    console.log('\n2️⃣ Syncing listings to database...');
    const syncedCount = await databaseService.syncListings(listings);
    console.log(`   ✅ Synced ${syncedCount} listings`);

    console.log('\n3️⃣ Testing filtering with minBounty = 0...');
    const filteredListings = await databaseService.getListingsByFilters(
      'all',
      ['All'],
      0, // minBounty = 0 to include null reward listings
      undefined,
      new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );
    
    console.log(`   📊 Found ${filteredListings.length} listings matching filters`);
    
    const nullRewardInResults = filteredListings.filter(l => l.usdAmount === null);
    console.log(`   🔍 Found ${nullRewardInResults.length} null reward listings in results`);
    
    if (nullRewardInResults.length > 0) {
      console.log('   📋 Null reward listings in results:');
      nullRewardInResults.forEach((listing, index) => {
        console.log(`      ${index + 1}. ${listing.title} (${listing.token}) - USD: ${listing.usdAmount}`);
      });
    }

    console.log('\n4️⃣ Testing filtering with minBounty = 100...');
    const filteredListingsHigh = await databaseService.getListingsByFilters(
      'all',
      ['All'],
      100, // minBounty = 100 to exclude null reward listings
      undefined,
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    console.log(`   📊 Found ${filteredListingsHigh.length} listings matching filters`);
    
    const nullRewardInHighResults = filteredListingsHigh.filter(l => l.usdAmount === null);
    console.log(`   🔍 Found ${nullRewardInHighResults.length} null reward listings in results (should be 0)`);

    console.log('\n✅ Null reward amount handling test completed!');
    
    console.log('\n📝 Summary:');
    console.log(`   - Total listings: ${listings.length}`);
    console.log(`   - Null reward listings: ${nullRewardListings.length}`);
    console.log(`   - Synced successfully: ${syncedCount}`);
    console.log(`   - Filtered with minBounty=0: ${filteredListings.length}`);
    console.log(`   - Filtered with minBounty=100: ${filteredListingsHigh.length}`);
    console.log(`   - Null reward handling: ${nullRewardInResults.length > 0 ? '✅ Working' : '❌ Not working'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNullRewardHandling();
