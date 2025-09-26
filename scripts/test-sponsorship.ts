import { SuperteamApiService } from '../src/services/superteam-api';
import { DatabaseService } from '../src/services/database';

async function testSponsorship() {
  console.log('🧪 Testing Sponsorship Type Functionality...\n');

  try {
    const apiService = SuperteamApiService.getInstance();
    const databaseService = DatabaseService.getInstance();

    console.log('1️⃣ Fetching mock data with sponsorship listings...');
    const listings = await apiService.fetchListings('all', ['All']);
    
    console.log(`   📊 Found ${listings.length} listings`);
    
    // Find sponsorship listings
    const sponsorshipListings = listings.filter(l => l.type === 'sponsorship');
    console.log(`   🎯 Found ${sponsorshipListings.length} sponsorship listings`);
    
    if (sponsorshipListings.length > 0) {
      console.log('   📋 Sponsorship listings:');
      sponsorshipListings.forEach((listing, index) => {
        console.log(`      ${index + 1}. ${listing.title} (${listing.token})`);
      });
    }

    console.log('\n2️⃣ Testing project type filtering...');
    
    // Test filtering by sponsorship type
    const sponsorshipFiltered = await databaseService.getListingsByFilters(
      'sponsorship',
      ['All'],
      0,
      undefined,
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    console.log(`   📊 Found ${sponsorshipFiltered.length} sponsorship listings in database`);
    
    // Test filtering by all types
    const allFiltered = await databaseService.getListingsByFilters(
      'all',
      ['All'],
      0,
      undefined,
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    console.log(`   📊 Found ${allFiltered.length} total listings in database`);

    console.log('\n✅ Sponsorship functionality test completed!');
    
    console.log('\n📝 Summary:');
    console.log(`   - Total listings: ${listings.length}`);
    console.log(`   - Sponsorship listings: ${sponsorshipListings.length}`);
    console.log(`   - Database sponsorship filtered: ${sponsorshipFiltered.length}`);
    console.log(`   - Database all filtered: ${allFiltered.length}`);
    console.log(`   - Sponsorship support: ${sponsorshipListings.length > 0 ? '✅ Working' : '❌ Not working'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSponsorship();
