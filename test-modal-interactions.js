// Browser Console Test Script for MekRecruitmentModalV4
// Copy and paste this into the browser console after opening the modal

console.log("🧪 MekRecruitmentModalV4 Test Script Started");

// Test the modal dimensions
function testModalWidth() {
    const modal = document.querySelector('[class*="max-w-md"]');
    if (modal) {
        const rect = modal.getBoundingClientRect();
        console.log(`📏 Modal width: ${rect.width}px (should be ~400-448px)`);
        return rect.width;
    } else {
        console.log("❌ Modal not found - make sure it's open");
        return null;
    }
}

// Test background texture
function testBackground() {
    const texturedBg = document.querySelector('[style*="backgroundImage"]');
    if (texturedBg) {
        console.log("✅ Textured background found");
        console.log("🎨 Background style:", texturedBg.style.backgroundImage.substring(0, 50) + "...");
        return true;
    } else {
        console.log("❌ Textured background not found");
        return false;
    }
}

// Test variation buff hover interactions
function testVariationHover() {
    const variationButtons = document.querySelectorAll('[class*="w-[60px]"]');
    console.log(`🎯 Found ${variationButtons.length} variation buffs`);
    
    variationButtons.forEach((button, index) => {
        const hasGrayBorder = button.classList.contains('border-gray-600') || 
                              button.className.includes('border-gray-600');
        console.log(`Buff ${index}: Gray border by default: ${hasGrayBorder}`);
    });
    
    return variationButtons.length;
}

// Test mek card hover effects
function testMekCardHover() {
    const mekCards = document.querySelectorAll('[class*="cursor-pointer"]');
    console.log(`🤖 Found ${mekCards.length} mek cards`);
    
    // Simulate hover on first mek card
    if (mekCards.length > 0) {
        const firstCard = mekCards[0];
        console.log("🖱️ Simulating hover on first mek card...");
        
        // Dispatch mouseenter event
        firstCard.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        
        setTimeout(() => {
            // Check for green percentage text
            const greenText = document.querySelectorAll('[class*="text-green-400"]');
            console.log(`💚 Found ${greenText.length} green text elements (should increase on hover)`);
            
            // Check for yellow glow on variation buffs
            const glowingBuffs = document.querySelectorAll('[class*="variation-hover-glow"]');
            console.log(`✨ Found ${glowingBuffs.length} glowing variation buffs`);
            
            // Clean up
            firstCard.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        }, 100);
    }
}

// Test console errors
function checkConsoleErrors() {
    console.log("🔍 Checking for console errors...");
    console.log("(Check the Console tab for any red error messages)");
}

// Run all tests
function runAllTests() {
    console.log("\n=== 🧪 MekRecruitmentModalV4 Test Results ===");
    
    const width = testModalWidth();
    const hasTexture = testBackground();
    const buffCount = testVariationHover();
    
    setTimeout(() => {
        testMekCardHover();
    }, 500);
    
    checkConsoleErrors();
    
    console.log("\n=== Test Summary ===");
    console.log(`Modal Width: ${width ? width + 'px' : 'Not found'}`);
    console.log(`Textured Background: ${hasTexture ? 'Yes' : 'No'}`);
    console.log(`Variation Buffs: ${buffCount}`);
    console.log("\n💡 To test hover manually:");
    console.log("1. Hover over mek cards and watch variation buffs at top");
    console.log("2. Look for yellow glow on matching variation buffs");
    console.log("3. Check that bonus percentages turn green");
    console.log("4. Verify no '+X% BOOST' headers on cards");
    
    return {
        width,
        hasTexture,
        buffCount
    };
}

// Auto-run if modal is already open
if (document.querySelector('[class*="max-w-md"]')) {
    console.log("🎯 Modal detected! Running tests...");
    runAllTests();
} else {
    console.log("📋 Test script loaded. Open the modal and run: runAllTests()");
}

// Make functions available globally
window.runAllTests = runAllTests;
window.testModalWidth = testModalWidth;
window.testBackground = testBackground;
window.testVariationHover = testVariationHover;
window.testMekCardHover = testMekCardHover;