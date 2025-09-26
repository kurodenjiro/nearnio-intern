import { DatabaseService } from '../src/services/database';

async function checkDatabase() {
  console.log('🔍 Checking Database Configuration...\n');

  try {
    const databaseService = DatabaseService.getInstance();
    
    console.log('1️⃣ Database Service Status:');
    console.log(`   - Using Prisma: ${databaseService.isUsingPrisma()}`);
    console.log(`   - Prisma Client: ${databaseService.getPrismaClient() ? 'Available' : 'Not Available'}`);

    console.log('\n2️⃣ Testing Database Connection:');
    try {
      // Try to get system config to test database connection
      const lastSync = await databaseService.getSystemConfig('last_sync_time');
      console.log(`   - Last sync time: ${lastSync || 'Never'}`);
      console.log('   ✅ Database connection successful');
    } catch (error) {
      console.error('   ❌ Database connection failed:', error);
    }

    console.log('\n3️⃣ Testing Listing Storage:');
    try {
      // Try to sync a simple test listing
      const testListing = {
        id: 999,
        title: 'Test Listing',
        rewardAmount: null,
        token: 'Any',
        deadline: new Date().toISOString(),
        type: 'project',
        status: 'OPEN',
        slug: 'test-listing',
        isWinnersAnnounced: false,
        isFeatured: false,
        compensationType: 'variable',
        minRewardAsk: null,
        maxRewardAsk: null,
        winnersAnnouncedAt: null,
        _count: {
          Comments: 0,
          Submission: 0
        },
        sponsor: {
          name: 'Test Sponsor',
          slug: 'test-sponsor',
          logo: 'https://example.com/logo.png',
          isVerified: false,
          st: false
        }
      };

      const syncedCount = await databaseService.syncListings([testListing]);
      console.log(`   ✅ Test sync successful: ${syncedCount} listings`);
    } catch (error) {
      console.error('   ❌ Test sync failed:', error);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkDatabase();
