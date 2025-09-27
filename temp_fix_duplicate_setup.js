const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/commands/setup.ts', 'utf8');

// Remove the duplicate message after startSetup call
content = content.replace(
  /    // Start setup process\n    await startSetup\(ctx\);\n    \n    const message = `🎯 \*Let's set up your bounty preferences\\!\\*\n\nI'll ask you a few questions to customize your notifications\\.\n\n\*Step 1: Bounty Range\*\nWhat bounty range are you interested in\?\n\nSelect from the buttons below:`;\n    \n    await ctx\.replyWithMarkdownV2\(message, { \n      parse_mode: 'MarkdownV2',\n      reply_markup: createBountyRangeKeyboard\(\)\n    }\);/
  ,
  '    // Start setup process\n    await startSetup(ctx);'
);

// Write back to file
fs.writeFileSync('src/commands/setup.ts', content);
console.log('Fixed duplicate setup messages');
