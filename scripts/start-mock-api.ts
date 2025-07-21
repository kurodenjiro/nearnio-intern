#!/usr/bin/env ts-node

import '../src/mock-server';

console.log('🎯 Starting Mock Superteam API Server...');
console.log('📝 This server provides mock data for testing the bot');
console.log('🔧 Use this to test notifications without hitting the real API');
console.log('');
console.log('💡 To use with your bot:');
console.log('   1. Set SUPERTEAM_API_BASE=http://localhost:3001/mock-api');
console.log('   2. Start your bot normally');
console.log('   3. The bot will use mock data instead of real API');
console.log('');
console.log('🔄 Mock data updates every minute automatically');
console.log('🛑 Press Ctrl+C to stop the server'); 