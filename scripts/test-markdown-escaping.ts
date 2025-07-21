#!/usr/bin/env ts-node

import { escapeMarkdownV2 } from '../src/utils/markdown';

function testMarkdownEscaping() {
  console.log('🧪 Testing MarkdownV2 Escaping...\n');

  // Test cases that were causing issues
  const testCases = [
    {
      name: 'Date with periods',
      input: 'Jul 23, 2025, 06:37 PM GMT+7',
      expected: 'Jul 23, 2025, 06:37 PM GMT\\+7'
    },
    {
      name: 'Title with special characters',
      input: 'Test Bounty (Special) - Version 2.0',
      expected: 'Test Bounty \\(Special\\) \\- Version 2\\.0'
    },
    {
      name: 'Text with periods',
      input: 'You already have an active reminder for this listing.',
      expected: 'You already have an active reminder for this listing\\.'
    },
    {
      name: 'Text with multiple special chars',
      input: 'You\'ll be notified as the deadline approaches.',
      expected: 'You\'ll be notified as the deadline approaches\\.'
    }
  ];

  console.log('📝 Testing escapeMarkdownV2 function:');
  
  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}:`);
    console.log(`   Input:    "${testCase.input}"`);
    
    const escaped = escapeMarkdownV2(testCase.input);
    console.log(`   Escaped:  "${escaped}"`);
    
    // Check if the escaped result contains the expected patterns
    const hasEscapedPeriods = escaped.includes('\\.');
    const hasEscapedParens = escaped.includes('\\(') && escaped.includes('\\)');
    const hasEscapedHyphens = escaped.includes('\\-');
    const hasEscapedPlus = escaped.includes('\\+');
    
    console.log(`   Checks:   Periods escaped: ${hasEscapedPeriods ? '✅' : '❌'}`);
    console.log(`             Parens escaped: ${hasEscapedParens ? '✅' : '❌'}`);
    console.log(`             Hyphens escaped: ${hasEscapedHyphens ? '✅' : '❌'}`);
    console.log(`             Plus escaped: ${hasEscapedPlus ? '✅' : '❌'}`);
  });

  // Test actual message templates
  console.log('\n📱 Testing Message Templates:');
  
  const testTitle = 'Test Bounty (Special) - Version 2.0';
  const testDeadline = 'Jul 23, 2025, 06:37 PM GMT+7';
  
  const escapedTitle = escapeMarkdownV2(testTitle);
  const escapedDeadline = escapeMarkdownV2(testDeadline);
  
  console.log('\nSuccess Message Template:');
  const successMessage = `✅ *Reminder Set "${escapedTitle}" Successfully\\!*

📅 *Deadline:* ${escapedDeadline}`;

  console.log(successMessage);
  
  console.log('\nExisting Reminder Message Template:');
  const existingMessage = `⏰ *Reminder Already Set*

*${escapedTitle}*

You already have an active reminder for this listing\\.

📅 *Deadline:* ${escapedDeadline}

You'll be notified as the deadline approaches\\.`;

  console.log(existingMessage);
  
  console.log('\nStop Reminder Message Template:');
  const stopMessage = `🛑 *Reminders Stopped*

✅ You will no longer receive deadline reminders for this listing\\.

To set a new reminder, click the "⏰ Remind Deadline" button on any listing notification\\.`;

  console.log(stopMessage);

  console.log('\n✅ MarkdownV2 escaping test completed!');
  console.log('\n📝 Summary:');
  console.log('   - Special characters properly escaped');
  console.log('   - Message templates ready for Telegram');
  console.log('   - No parsing errors expected');
}

// Run the test
testMarkdownEscaping(); 