/**
 * Paper2Slide API Test Script
 * 
 * Run this in Zotero's JavaScript console:
 * Tools > Developer > Run JavaScript
 * Check "作为异步函数执行" (Run as async)
 */

// Test Configuration
const TEST_CONFIG = {
    provider: 'deepseek',
    apiKey: 'sk-419e26ae84a848a095bdbe17fc3b5cd4',  // Replace with your key
    model: 'deepseek-chat',
    prompt: 'academic'
};

// Sample paper text for testing
const SAMPLE_TEXT = `
This is a sample academic paper about machine learning.

Abstract:
We present a novel approach to deep learning that improves accuracy by 15%.

Introduction:
Machine learning has become increasingly important in modern computing.
Our work focuses on improving the efficiency of neural network training.

Methods:
We used a dataset of 10,000 samples.
Training was performed on GPU clusters for 100 epochs.

Results:
Our method achieved 95% accuracy on the test set.
This represents a 15% improvement over the baseline.

Conclusion:
Deep learning continues to advance rapidly.
Future work will explore larger models.
`;

// Test 1: Test DeepSeek API directly
async function testDeepSeekAPI() {
    console.log("=== Test 1: DeepSeek API ===");

    const url = 'https://api.deepseek.com/v1/chat/completions';
    const body = JSON.stringify({
        model: TEST_CONFIG.model,
        messages: [
            { role: 'user', content: 'Say hello in Chinese' }
        ],
        max_tokens: 100
    });

    try {
        let response = await Zotero.HTTP.request('POST', url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + TEST_CONFIG.apiKey
            },
            body: body,
            timeout: 30000
        });

        console.log("Status:", response.status);
        let data = JSON.parse(response.responseText);
        console.log("Response:", data.choices?.[0]?.message?.content);
        return { success: true, response: data };
    } catch (e) {
        console.error("Error:", e);
        return { success: false, error: e.message };
    }
}

// Test 2: Test Slide Generation
async function testSlideGeneration() {
    console.log("\n=== Test 2: Slide Generation ===");

    // Set preferences for test
    Zotero.Prefs.set('extensions.paper2slide.provider', TEST_CONFIG.provider, true);
    Zotero.Prefs.set('extensions.paper2slide.apiKey', TEST_CONFIG.apiKey, true);
    Zotero.Prefs.set('extensions.paper2slide.model', TEST_CONFIG.model, true);
    Zotero.Prefs.set('extensions.paper2slide.prompt', TEST_CONFIG.prompt, true);
    Zotero.Prefs.set('extensions.paper2slide.style', 'modern', true);

    console.log("Preferences set. Testing LLM service...");

    if (typeof Paper2SlideLLM === 'undefined') {
        console.error("Paper2SlideLLM not loaded. Please restart Zotero.");
        return { success: false, error: "LLM service not loaded" };
    }

    try {
        let slidesHTML = await Paper2SlideLLM.generateSlides(SAMPLE_TEXT);
        console.log("Slides HTML length:", slidesHTML.length);
        console.log("First 500 chars:", slidesHTML.substring(0, 500));
        return { success: true, html: slidesHTML };
    } catch (e) {
        console.error("Error:", e);
        return { success: false, error: e.message };
    }
}

// Test 3: Check all preferences
function testPreferences() {
    console.log("\n=== Test 3: Preferences ===");

    const prefs = [
        'extensions.paper2slide.provider',
        'extensions.paper2slide.apiKey',
        'extensions.paper2slide.model',
        'extensions.paper2slide.prompt',
        'extensions.paper2slide.style'
    ];

    for (let pref of prefs) {
        let value = Zotero.Prefs.get(pref, true);
        console.log(pref + ":", value || "(not set)");
    }
}

// Run all tests
async function runAllTests() {
    console.log("Starting Paper2Slide API Tests...\n");

    testPreferences();

    let result1 = await testDeepSeekAPI();
    console.log("Test 1 Result:", result1.success ? "PASS" : "FAIL");

    if (result1.success) {
        let result2 = await testSlideGeneration();
        console.log("Test 2 Result:", result2.success ? "PASS" : "FAIL");
    }

    console.log("\n=== Tests Complete ===");
}

// Execute
return runAllTests();
