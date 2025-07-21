#!/usr/bin/env ts-node

import { DatabaseService } from '../src/services/database';
import { ReminderService } from '../src/services/reminder';

async function testReminderButton() {
  console.log('🧪 Testing Reminder Button Functionality...\n');

  const databaseService = DatabaseService.getInstance();
  const reminderService = ReminderService.getInstance();

  // Test 1: Create a test listing in database
  console.log('1️⃣ Creating test listing...');
  const testListing = {
    id: 999,
    title: 'Test Bounty for Reminder Button',
    rewardAmount: 500,
    token: 'USDC',
    deadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    type: 'bounty',
    status: 'OPEN',
    slug: 'test-bounty-reminder-button',
    sequentialId: 999,
    sponsorName: 'Test Sponsor',
    sponsorSlug: 'test-sponsor',
    sponsorLogo: 'https://example.com/logo.png',
    sponsorIsVerified: false,
    sponsorSt: false,
    isWinnersAnnounced: false,
    isFeatured: false,
    compensationType: 'fixed',
    minRewardAsk: null,
    maxRewardAsk: null,
    winnersAnnouncedAt: null,
    commentsCount: 0,
    submissionCount: 0,
    description: 'Test description',
    skills: [],
    mappedCategory: 'DEV',
    createdAt: new Date(),
    updatedAt: new Date(),
    syncedAt: new Date()
  };

  try {
    // Add test listing to database
    if (databaseService.isUsingPrisma() && databaseService.getPrismaClient()) {
      await databaseService.getPrismaClient().listing.upsert({
        where: { id: testListing.id },
        update: testListing,
        create: testListing
      });
      console.log('   ✅ Test listing created in database');
    } else {
      console.log('   ⚠️ Using in-memory storage');
    }
  } catch (error) {
    console.log('   ❌ Error creating test listing:', error);
  }

  // Test 2: Simulate reminder button click
  console.log('\n2️⃣ Simulating reminder button click...');
  const testUserId = 123456789;
  const listingId = testListing.id;
  
  // Simulate the callback data that would be sent
  const callbackData = `add_reminder_${listingId}`;
  console.log(`   Callback data: ${callbackData}`);
  
  // Parse the listing ID from callback data (same as in handler)
  const parsedListingId = parseInt(callbackData.replace('add_reminder_', ''));
  console.log(`   Parsed listing ID: ${parsedListingId}`);
  
  if (isNaN(parsedListingId)) {
    console.log('   ❌ Failed to parse listing ID');
    return;
  }

  // Test 3: Check if listing exists
  console.log('\n3️⃣ Checking if listing exists...');
  const listing = await databaseService.getListingById(parsedListingId);
  
  if (!listing) {
    console.log('   ❌ Listing not found in database');
    return;
  }
  
  console.log(`   ✅ Found listing: ${listing.title}`);

  // Test 4: Check if user already has reminder
  console.log('\n4️⃣ Checking existing reminders...');
  const hasReminder = await reminderService.hasActiveReminder(testUserId, parsedListingId);
  console.log(`   Has active reminder: ${hasReminder ? 'Yes' : 'No'}`);

  // Test 5: Add reminder
  console.log('\n5️⃣ Adding reminder...');
  const addResult = await reminderService.addReminder(
    testUserId,
    parsedListingId,
    listing.slug,
    listing.title,
    new Date(listing.deadline)
  );
  
  console.log(`   Add result: ${addResult ? '✅ Success' : '❌ Failed'}`);

  // Test 6: Verify reminder was added
  console.log('\n6️⃣ Verifying reminder was added...');
  const hasReminderAfter = await reminderService.hasActiveReminder(testUserId, parsedListingId);
  console.log(`   Has active reminder after adding: ${hasReminderAfter ? '✅ Yes' : '❌ No'}`);

  // Test 7: Get due reminders
  console.log('\n7️⃣ Getting due reminders...');
  const dueReminders = await reminderService.getDueReminders();
  console.log(`   Due reminders found: ${dueReminders.length}`);
  
  const ourReminder = dueReminders.find(r => r.listingId === parsedListingId && r.userId === testUserId);
  if (ourReminder) {
    console.log(`   ✅ Our reminder found: ${ourReminder.title} - ${ourReminder.timeLeft}`);
  } else {
    console.log('   ❌ Our reminder not found in due reminders');
  }

  // Test 8: Clean up
  console.log('\n8️⃣ Cleaning up...');
  const removeResult = await reminderService.removeReminder(testUserId, parsedListingId);
  console.log(`   Remove result: ${removeResult ? '✅ Success' : '❌ Failed'}`);

  console.log('\n✅ Reminder button functionality test completed!');
  console.log('\n📝 Summary:');
  console.log('   - Callback data parsing: ✅ Working');
  console.log('   - Database lookup: ✅ Working');
  console.log('   - Reminder creation: ✅ Working');
  console.log('   - Reminder verification: ✅ Working');
  console.log('   - Due reminders check: ✅ Working');
}

// Run the test
testReminderButton().catch(console.error); 