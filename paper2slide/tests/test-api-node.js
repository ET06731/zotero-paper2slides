/**
 * Paper2Slide API Test - Node.js Version
 * 
 * Usage:
 *   node test-api-node.js
 * 
 * Requires: No external dependencies (uses built-in fetch)
 */

const API_KEY = 'sk-419e26ae84a848a095bdbe17fc3b5cd4'; // DeepSeek API key

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

const PROMPT_TEMPLATE = `You are an expert at creating academic presentation slides. 
Given the following academic paper text, create a well-structured HTML presentation with 6-10 slides.

Requirements:
- First slide: Title and authors
- Include: Background, Methods, Key Results, Discussion, Conclusion
- Use bullet points for clarity
- Keep each slide focused on one main idea
- Use clear, academic language

Output ONLY valid HTML code for the slides, no markdown, no explanations.
Use this exact structure for each slide:
<section class="slide">
  <h2>Slide Title</h2>
  <div class="content">
    <ul>
      <li>Point 1</li>
      <li>Point 2</li>
    </ul>
  </div>
</section>`;

async function testDeepSeekAPI() {
    console.log('=== Testing DeepSeek API ===\n');

    const url = 'https://api.deepseek.com/v1/chat/completions';

    // Test 1: Simple hello
    console.log('Test 1: Simple greeting...');
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'Say hello in Chinese' }],
                max_tokens: 100
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`❌ FAILED: ${response.status} - ${error}`);
            return false;
        }

        const data = await response.json();
        console.log(`✅ PASSED: ${data.choices?.[0]?.message?.content}\n`);
    } catch (e) {
        console.error(`❌ FAILED: ${e.message}`);
        return false;
    }

    // Test 2: Slide generation
    console.log('Test 2: Slide generation...');
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{
                    role: 'user',
                    content: PROMPT_TEMPLATE + '\n\n---\n\nPaper text:\n\n' + SAMPLE_TEXT
                }],
                max_tokens: 4000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`❌ FAILED: ${response.status} - ${error}`);
            return false;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            console.error('❌ FAILED: No content in response');
            return false;
        }

        console.log(`✅ PASSED: Generated ${content.length} characters`);
        console.log('\n--- Generated HTML Preview (first 800 chars) ---');
        console.log(content.substring(0, 800));
        console.log('--- End Preview ---\n');

        // Check if it contains expected HTML
        if (content.includes('<section') && content.includes('class="slide"')) {
            console.log('✅ HTML structure looks correct!');
        } else {
            console.log('⚠️ HTML structure may not match expected format');
        }

        return true;
    } catch (e) {
        console.error(`❌ FAILED: ${e.message}`);
        return false;
    }
}

async function main() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║     Paper2Slide API Test Suite         ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log(`API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);
    console.log(`Time: ${new Date().toISOString()}\n`);

    const passed = await testDeepSeekAPI();

    console.log('\n' + '='.repeat(40));
    console.log(passed ? '✅ All tests passed!' : '❌ Some tests failed');
    console.log('='.repeat(40));
}

main().catch(console.error);
