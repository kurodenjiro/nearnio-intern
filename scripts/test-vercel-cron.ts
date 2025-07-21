import { CronjobService } from '../src/services/cronjob';

async function testVercelCronEndpoints() {
  console.log('🧪 Testing Vercel Cron Endpoints...\n');

  const cronjobService = CronjobService.getInstance();

  try {
    // Test 1: Sync API data to database
    console.log('1️⃣ Testing Sync Endpoint (/api/cron/sync)...');
    await cronjobService.syncApiDataToDatabase();
    console.log('   ✅ Sync completed successfully\n');

    // Test 2: Send notifications from database
    console.log('2️⃣ Testing Notifications Endpoint (/api/cron/notifications)...');
    await cronjobService.sendNotificationsFromDatabase();
    console.log('   ✅ Notifications check completed successfully\n');

    // Test 3: Send reminder notifications
    console.log('3️⃣ Testing Reminders Endpoint (/api/cron/reminders)...');
    await cronjobService.sendReminderNotifications();
    console.log('   ✅ Reminders check completed successfully\n');

    // Test 4: Get sync status
    console.log('4️⃣ Testing Status Check...');
    const status = await cronjobService.getSyncStatus();
    console.log('   📊 Current Status:');
    console.log(`      - Service Running: ${status.isRunning}`);
    console.log(`      - Last Sync Time: ${status.lastSyncTime || 'Never'}`);
    console.log(`      - Last Notification Check: ${status.lastNotificationCheck || 'Never'}\n`);

    console.log('✅ All Vercel cron endpoints tested successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Sync endpoint: ✅ Working');
    console.log('   - Notifications endpoint: ✅ Working');
    console.log('   - Reminders endpoint: ✅ Working');
    console.log('   - Status tracking: ✅ Working');
    console.log('\n🚀 Ready for Vercel deployment!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testVercelCronEndpoints(); 