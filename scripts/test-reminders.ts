#!/usr/bin/env ts-node

import { ReminderService } from '../src/services/reminder';
import { DatabaseService } from '../src/services/database';

async function testReminders() {
  console.log('🧪 Testing Reminder Functionality...\n');

  const reminderService = ReminderService.getInstance();
  const databaseService = DatabaseService.getInstance();

  // Test 1: Add a reminder
  console.log('1️⃣ Testing add reminder...');
  const testUserId = 123456789;
  const testListingId = 1;
  const testListingSlug = 'test-listing';
  const testTitle = 'Test Bounty';
  const testDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  const addResult = await reminderService.addReminder(
    testUserId,
    testListingId,
    testListingSlug,
    testTitle,
    testDeadline
  );
  console.log(`   Add reminder result: ${addResult ? '✅ Success' : '❌ Failed'}`);

  // Test 2: Check if reminder exists
  console.log('\n2️⃣ Testing check reminder...');
  const hasReminder = await reminderService.hasActiveReminder(testUserId, testListingId);
  console.log(`   Has active reminder: ${hasReminder ? '✅ Yes' : '❌ No'}`);

  // Test 3: Get due reminders
  console.log('\n3️⃣ Testing get due reminders...');
  const dueReminders = await reminderService.getDueReminders();
  console.log(`   Due reminders found: ${dueReminders.length}`);
  dueReminders.forEach((reminder, index) => {
    console.log(`   Reminder ${index + 1}: ${reminder.title} - ${reminder.timeLeft}`);
  });

  // Test 4: Remove reminder
  console.log('\n4️⃣ Testing remove reminder...');
  const removeResult = await reminderService.removeReminder(testUserId, testListingId);
  console.log(`   Remove reminder result: ${removeResult ? '✅ Success' : '❌ Failed'}`);

  // Test 5: Verify reminder is removed
  console.log('\n5️⃣ Testing verify removal...');
  const hasReminderAfter = await reminderService.hasActiveReminder(testUserId, testListingId);
  console.log(`   Has active reminder after removal: ${hasReminderAfter ? '❌ Still exists' : '✅ Removed'}`);

  // Test 6: Test time calculations
  console.log('\n6️⃣ Testing time calculations...');
  const now = new Date();
  const testDeadlines = [
    new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
    new Date(now.getTime() + 10 * 60 * 60 * 1000),     // 10 hours
    new Date(now.getTime() + 5 * 60 * 60 * 1000),      // 5 hours
    new Date(now.getTime() + 2 * 60 * 60 * 1000),      // 2 hours
    new Date(now.getTime() + 45 * 60 * 1000),          // 45 minutes
    new Date(now.getTime() + 15 * 60 * 1000),          // 15 minutes
  ];

  testDeadlines.forEach((deadline, index) => {
    const reminder = {
      userId: testUserId,
      listingId: testListingId + index,
      listingSlug: `test-${index}`,
      title: `Test Bounty ${index + 1}`,
      deadline: deadline,
      timeLeft: '',
      isFinal: false
    };
    
    // Use private method through reflection (for testing only)
    const timeLeft = (reminderService as any).calculateTimeLeft(deadline);
    console.log(`   Test ${index + 1}: ${deadline.toLocaleString()} -> ${timeLeft || 'No reminder'}`);
  });

  console.log('\n✅ Reminder functionality test completed!');
}

// Run the test
testReminders().catch(console.error); 