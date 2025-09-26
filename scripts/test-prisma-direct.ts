import { PrismaClient } from '@prisma/client';

async function testPrismaDirect() {
  console.log('🔍 Testing Prisma Direct Insert...\n');

  try {
    const prisma = new PrismaClient();
    
    console.log('1️⃣ Testing direct Prisma insert...');
    
    // Test with a simple listing
    const testListing = {
      id: 999,
      title: 'Test Direct Insert',
      rewardAmount: null, // NULL REWARD AMOUNT
      token: 'Any',
      deadline: new Date(),
      type: 'project',
      status: 'OPEN',
      slug: 'test-direct-insert',
      isWinnersAnnounced: false,
      isFeatured: false,
      compensationType: 'variable',
      minRewardAsk: null,
      maxRewardAsk: null,
      winnersAnnouncedAt: null,
      commentsCount: 0,
      submissionCount: 0,
      description: 'Test description',
      skills: [],
      mappedCategory: 'OTHER',
      sponsorName: 'Test Sponsor',
      sponsorSlug: 'test-sponsor',
      sponsorLogo: 'https://example.com/logo.png',
      sponsorIsVerified: false,
      sponsorSt: false,
      syncedAt: new Date()
    };

    console.log('   📝 Test data prepared');
    console.log(`   - Title: ${testListing.title}`);
    console.log(`   - Reward: ${testListing.rewardAmount}`);
    console.log(`   - Token: ${testListing.token}`);
    console.log(`   - Slug: ${testListing.slug}`);

    try {
      const result = await prisma.listing.create({
        data: testListing
      });
      console.log('   ✅ Direct insert successful!');
      console.log(`   - Created listing with ID: ${result.id}`);
    } catch (error) {
      console.error('   ❌ Direct insert failed:', error);
      console.error('   Error details:', (error as Error).message);
    }

    console.log('\n2️⃣ Testing Prisma upsert...');
    try {
      const upsertResult = await prisma.listing.upsert({
        where: { slug: 'test-direct-insert' },
        update: {
          title: 'Updated Test Direct Insert',
          rewardAmount: null
        },
        create: {
          id: 1000,
          title: 'Upsert Test Insert',
          rewardAmount: null,
          token: 'Any',
          deadline: new Date(),
          type: 'project',
          status: 'OPEN',
          slug: 'test-upsert-insert',
          isWinnersAnnounced: false,
          isFeatured: false,
          compensationType: 'variable',
          minRewardAsk: null,
          maxRewardAsk: null,
          winnersAnnouncedAt: null,
          commentsCount: 0,
          submissionCount: 0,
          description: 'Upsert test description',
          skills: [],
          mappedCategory: 'OTHER',
          sponsorName: 'Upsert Test Sponsor',
          sponsorSlug: 'upsert-test-sponsor',
          sponsorLogo: 'https://example.com/logo.png',
          sponsorIsVerified: false,
          sponsorSt: false,
          syncedAt: new Date()
        }
      });
      console.log('   ✅ Upsert successful!');
      console.log(`   - Upserted listing with ID: ${upsertResult.id}`);
    } catch (error) {
      console.error('   ❌ Upsert failed:', error);
      console.error('   Error details:', (error as Error).message);
    }

    console.log('\n3️⃣ Checking database contents...');
    const allListings = await prisma.listing.findMany();
    console.log(`   📊 Found ${allListings.length} listings in database`);
    
    allListings.forEach((listing, index) => {
      console.log(`   ${index + 1}. ${listing.title} (Reward: ${listing.rewardAmount}, Token: ${listing.token})`);
    });

    await prisma.$disconnect();
    console.log('\n✅ Prisma test completed!');

  } catch (error) {
    console.error('❌ Prisma test failed:', error);
    console.error('Error details:', (error as Error).message);
  }
}

testPrismaDirect();
