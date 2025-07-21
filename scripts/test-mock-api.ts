#!/usr/bin/env ts-node

// Using native fetch (available in Node.js 18+)

const MOCK_API_BASE = 'http://localhost:3001';

async function testMockApi() {
  console.log('🧪 Testing Mock Superteam API...\n');

  try {
    // Test health endpoint
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${MOCK_API_BASE}/mock-api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    console.log('');

    // Test status endpoint
    console.log('2️⃣ Testing status endpoint...');
    const statusResponse = await fetch(`${MOCK_API_BASE}/mock-api/status`);
    const statusData = await statusResponse.json();
    console.log('✅ API Status:', {
      totalListings: statusData.totalListings,
      categories: statusData.categories,
      types: statusData.types,
      tokens: statusData.tokens
    });
    console.log('');

    // Test listings endpoint
    console.log('3️⃣ Testing listings endpoint...');
    const listingsResponse = await fetch(`${MOCK_API_BASE}/mock-api/listings`);
    const listingsData = await listingsResponse.json();
    console.log(`✅ Found ${listingsData.length} listings`);
    console.log('📋 Sample listings:');
    listingsData.slice(0, 3).forEach((listing: any, index: number) => {
      console.log(`   ${index + 1}. [ID: ${listing.id}] ${listing.title}`);
      console.log(`      💰 ${listing.rewardAmount} ${listing.token}`);
      console.log(`      🏷️ ${listing.type} | ${listing.sponsor.name}`);
      console.log(`      💬 Comments: ${listing._count.Comments}`);
      console.log('');
    });

    // Test specific listing endpoint
    if (listingsData.length > 0) {
      const firstListing = listingsData[0];
      console.log('4️⃣ Testing specific listing endpoint...');
      const detailResponse = await fetch(`${MOCK_API_BASE}/mock-api/listings/${firstListing.slug}`);
      const detailData = await detailResponse.json();
      console.log(`✅ Detailed listing: [ID: ${detailData.id}] ${detailData.title}`);
      console.log(`   💰 Reward: ${detailData.rewardAmount} ${detailData.token}`);
      console.log(`   🏢 Sponsor: ${detailData.sponsor.name} (${detailData.sponsor.isVerified ? '✅' : '❌'} verified)`);
      console.log(`   💬 Comments: ${detailData._count.Comments}`);
      console.log('');
    }

    // Test dynamic data changes
    console.log('5️⃣ Testing dynamic data changes...');
    console.log('   Fetching data multiple times to show changes:');
    
    for (let i = 1; i <= 3; i++) {
      const dynamicResponse = await fetch(`${MOCK_API_BASE}/mock-api/listings`);
      const dynamicData = await dynamicResponse.json();
      console.log(`   Fetch ${i}: ${dynamicData.length} listings`);
      
      if (dynamicData.length > 0) {
        const sample = dynamicData[0];
        console.log(`   Sample: [ID: ${sample.id}] ${sample.title} (${sample.rewardAmount} ${sample.token})`);
      }
    }
    console.log('');

    // Test reset endpoint
    console.log('6️⃣ Testing reset endpoint...');
    const resetResponse = await fetch(`${MOCK_API_BASE}/mock-api/reset`, { method: 'POST' });
    const resetData = await resetResponse.json();
    console.log('✅ Reset result:', resetData);
    console.log('');

    console.log('🎉 All tests passed! Mock API is working correctly.');
    console.log('');
    console.log('💡 Key Features:');
    console.log('   🔄 Data changes on every request');
    console.log('   📊 Random listings, rewards, and deadlines');
    console.log('   🎯 Perfect for testing notifications');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Set SUPERTEAM_API_BASE=http://localhost:3001/mock-api in your .env');
    console.log('   2. Start your bot with: npm run dev');
    console.log('   3. The bot will use dynamic mock data for testing');
    console.log('   4. Each API call returns different data!');

  } catch (error) {
    console.error('❌ Error testing mock API:', error);
    console.log('');
    console.log('🔧 Make sure the mock API server is running:');
    console.log('   npm run mock-api');
  }
}

// Run the test
testMockApi(); 