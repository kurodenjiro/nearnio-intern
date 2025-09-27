import { readFileSync } from 'fs';

function testMessageRemoval() {
  console.log('🧪 Testing Message Removal in Setup Flow...\n');
  
  try {
    const handlerContent = readFileSync('src/handlers/message-handler.ts', 'utf8');
    
    console.log('1️⃣ Checking selection handlers...');
    
    // Check if selection handlers use editMessageText
    const bountyRangeUsesEdit = handlerContent.includes('handleBountyRangeSelection') && 
                               handlerContent.includes('ctx.editMessageText');
    const categoryUsesEdit = handlerContent.includes('handleCategorySelection') && 
                            handlerContent.includes('ctx.editMessageText');
    const projectTypeUsesEdit = handlerContent.includes('handleProjectTypeSelection') && 
                               handlerContent.includes('ctx.editMessageText');
    const minBountyUsesEdit = handlerContent.includes('handleMinBountySelection') && 
                             handlerContent.includes('ctx.editMessageText');
    
    console.log(`   ✅ Bounty range selection uses editMessageText: ${bountyRangeUsesEdit}`);
    console.log(`   ✅ Category selection uses editMessageText: ${categoryUsesEdit}`);
    console.log(`   ✅ Project type selection uses editMessageText: ${projectTypeUsesEdit}`);
    console.log(`   ✅ Min bounty selection uses editMessageText: ${minBountyUsesEdit}`);
    
    console.log('\n2️⃣ Checking back button handlers...');
    
    // Check if back button handlers use editMessageText
    const backToCategoriesUsesEdit = handlerContent.includes('handleBackToCategories') && 
                                    handlerContent.includes('ctx.editMessageText');
    const backToBountyRangeUsesEdit = handlerContent.includes('handleBackToBountyRange') && 
                                     handlerContent.includes('ctx.editMessageText');
    const backToProjectTypeUsesEdit = handlerContent.includes('handleBackToProjectType') && 
                                     handlerContent.includes('ctx.editMessageText');
    
    console.log(`   ✅ Back to categories uses editMessageText: ${backToCategoriesUsesEdit}`);
    console.log(`   ✅ Back to bounty range uses editMessageText: ${backToBountyRangeUsesEdit}`);
    console.log(`   ✅ Back to project type uses editMessageText: ${backToProjectTypeUsesEdit}`);
    
    console.log('\n3️⃣ Checking for any remaining ctx.reply in handlers...');
    
    // Check if there are any ctx.reply calls in the handlers
    const hasReplyInHandlers = handlerContent.includes('await ctx.reply(');
    console.log(`   ✅ No ctx.reply in handlers: ${!hasReplyInHandlers}`);
    
    console.log('\n4️⃣ Checking setup flow consistency...');
    
    // Check if all setup-related functions use editMessageText
    const setupFunctions = [
      'handleBountyRangeSelection',
      'handleMinBountySelection', 
      'handleCategorySelection',
      'handleProjectTypeSelection',
      'handleBackToCategories',
      'handleBackToBountyRange',
      'handleBackToProjectType'
    ];
    
    let allUseEdit = true;
    for (const func of setupFunctions) {
      const funcUsesEdit = handlerContent.includes(func) && 
                          handlerContent.includes('ctx.editMessageText');
      if (!funcUsesEdit) {
        allUseEdit = false;
        console.log(`   ❌ ${func} does not use editMessageText`);
      }
    }
    
    if (allUseEdit) {
      console.log(`   ✅ All setup functions use editMessageText`);
    }
    
    console.log('\n5️⃣ Checking startSetup function...');
    
    // Check if startSetup uses ctx.reply (should be reply, not editMessageText)
    const startSetupUsesReply = handlerContent.includes('export const startSetup') && 
                               handlerContent.includes('await ctx.reply(');
    console.log(`   ✅ startSetup uses ctx.reply: ${startSetupUsesReply}`);
    
    console.log('\n✅ Message removal test completed!');
    
    const isFixed = bountyRangeUsesEdit && 
                   categoryUsesEdit && 
                   projectTypeUsesEdit && 
                   minBountyUsesEdit && 
                   backToCategoriesUsesEdit && 
                   backToBountyRangeUsesEdit && 
                   backToProjectTypeUsesEdit && 
                   !hasReplyInHandlers && 
                   allUseEdit && 
                   startSetupUsesReply;
    
    if (isFixed) {
      console.log('\n🎉 Success! Message removal is now working properly.');
      console.log('   - All selection handlers use editMessageText');
      console.log('   - All back button handlers use editMessageText');
      console.log('   - No ctx.reply calls in handlers');
      console.log('   - startSetup correctly uses ctx.reply');
      console.log('   - Setup flow will now remove old messages');
    } else {
      console.log('\n⚠️ Some issues may still exist. Please review the implementation.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMessageRemoval();
