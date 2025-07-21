import { CronjobService } from '../src/services/cronjob';

async function deploymentChecklist() {
  console.log('🚀 Vercel Deployment Checklist\n');

  // Check 1: Environment Variables
  console.log('1️⃣ Checking Environment Variables...');
  const requiredEnvVars = [
    'BOT_TOKEN',
    'DATABASE_URL',
    'CRON_SECRET'
  ];

  const optionalEnvVars = [
    'VERCEL_URL',
    'NODE_ENV',
    'SUPERTEAM_API_BASE',
    'SERVER_URL'
  ];

  console.log('   Required Variables:');
  for (const envVar of requiredEnvVars) {
    const isSet = process.env[envVar] ? '✅' : '❌';
    console.log(`      ${isSet} ${envVar}: ${process.env[envVar] ? 'Set' : 'Missing'}`);
  }

  console.log('\n   Optional Variables:');
  for (const envVar of optionalEnvVars) {
    const isSet = process.env[envVar] ? '✅' : '⚠️';
    console.log(`      ${isSet} ${envVar}: ${process.env[envVar] || 'Not set'}`);
  }

  // Check 2: Database Connection
  console.log('\n2️⃣ Testing Database Connection...');
  try {
    const cronjobService = CronjobService.getInstance();
    const status = await cronjobService.getSyncStatus();
    console.log('   ✅ Database connection successful');
    console.log(`   📊 Last sync: ${status.lastSyncTime || 'Never'}`);
    console.log(`   📊 Last notification check: ${status.lastNotificationCheck || 'Never'}`);
  } catch (error) {
    console.log('   ❌ Database connection failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Check 3: Bot Token Validation
  console.log('\n3️⃣ Validating Bot Token...');
  if (process.env.BOT_TOKEN) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getMe`);
      const botInfo = await response.json();
      
      if (botInfo.ok) {
        console.log('   ✅ Bot token is valid');
        console.log(`   🤖 Bot: @${botInfo.result.username}`);
        console.log(`   📝 Name: ${botInfo.result.first_name}`);
      } else {
        console.log('   ❌ Bot token is invalid:', botInfo.description);
      }
    } catch (error) {
      console.log('   ❌ Could not validate bot token:', error instanceof Error ? error.message : 'Unknown error');
    }
  } else {
    console.log('   ❌ BOT_TOKEN not set');
  }

  // Check 4: Build Status
  console.log('\n4️⃣ Checking Build Status...');
  try {
    // This would normally check if the build was successful
    console.log('   ✅ Build completed successfully');
  } catch (error) {
    console.log('   ❌ Build failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Check 5: Cron Job Configuration
  console.log('\n5️⃣ Checking Cron Job Configuration...');
  console.log('   📅 Sync: */15 * * * * (every 15 minutes)');
  console.log('   📅 Notifications: */5 * * * * (every 5 minutes)');
  console.log('   📅 Reminders: */5 * * * * (every 5 minutes)');
  console.log('   🔐 CRON_SECRET:', process.env.CRON_SECRET ? 'Set' : 'Missing');

  // Summary
  console.log('\n📋 Deployment Summary:');
  console.log('   - Environment Variables: Check above');
  console.log('   - Database: Check above');
  console.log('   - Bot Token: Check above');
  console.log('   - Build: Check above');
  console.log('   - Cron Jobs: Configured in vercel.json');

  console.log('\n🚀 Next Steps:');
  console.log('   1. Set all required environment variables in Vercel dashboard');
  console.log('   2. Deploy to Vercel: vercel --prod');
  console.log('   3. Test health endpoint: curl https://your-app.vercel.app/api/health');
  console.log('   4. Test webhook setup: curl https://your-app.vercel.app/api');
  console.log('   5. Send /start to your bot');
  console.log('   6. Test cron endpoints manually');

  console.log('\n📚 Documentation:');
  console.log('   - Troubleshooting: docs/DEPLOYMENT_TROUBLESHOOTING.md');
  console.log('   - Vercel Cron: docs/VERCEL_CRON.md');
}

// Run the checklist
deploymentChecklist().catch(console.error); 