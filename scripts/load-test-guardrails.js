/**
 * Load Testing Script for Guardrails
 * Tests rate limiting and budget guardrails with multiple requests
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_TEXT = 'Hello world, this is a test translation request.';
const LARGE_TEXT = 'a'.repeat(15000); // Exceeds per-request limit
const NUM_REQUESTS = 50;
const DELAY_MS = 100; // 100ms between requests

// Test results
let results = {
  successful: 0,
  rateLimited: 0,
  budgetExceeded: 0,
  errors: 0,
  responses: []
};

/**
 * Make a request to the translation API
 */
function makeRequest(text, requestNum) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      text: text,
      variant: 'ancient'
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const startTime = Date.now();
    const req = http.request(`${BASE_URL}/api/translate`, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const result = {
          requestNum,
          status: res.statusCode,
          responseTime,
          headers: res.headers,
          body: body.substring(0, 200) // Truncate body for logging
        };

        results.responses.push(result);

        if (res.statusCode === 200) {
          results.successful++;
          console.log(`✅ Request ${requestNum}: Success (${responseTime}ms)`);
        } else if (res.statusCode === 429) {
          try {
            const errorBody = JSON.parse(body);
            if (errorBody.message && errorBody.message.includes('Rate limit')) {
              results.rateLimited++;
              console.log(`🚫 Request ${requestNum}: Rate limited (${responseTime}ms)`);
            } else if (errorBody.message && errorBody.message.includes('Budget')) {
              results.budgetExceeded++;
              console.log(`💰 Request ${requestNum}: Budget exceeded (${responseTime}ms)`);
            } else {
              results.errors++;
              console.log(`❌ Request ${requestNum}: Error ${res.statusCode} (${responseTime}ms)`);
            }
          } catch (e) {
            results.errors++;
            console.log(`❌ Request ${requestNum}: Error ${res.statusCode} (${responseTime}ms)`);
          }
        } else {
          results.errors++;
          console.log(`❌ Request ${requestNum}: Error ${res.statusCode} (${responseTime}ms)`);
        }

        resolve();
      });
    });

    req.on('error', (err) => {
      results.errors++;
      console.log(`❌ Request ${requestNum}: Network error - ${err.message}`);
      resolve();
    });

    req.write(data);
    req.end();
  });
}

/**
 * Test rate limiting with normal text
 */
async function testRateLimiting() {
  console.log('\n🧪 Testing Rate Limiting...');
  console.log(`Making ${NUM_REQUESTS} requests with ${DELAY_MS}ms delay`);
  
  for (let i = 1; i <= NUM_REQUESTS; i++) {
    await makeRequest(TEST_TEXT, i);
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }
}

/**
 * Test budget guardrails with large text
 */
async function testBudgetGuardrails() {
  console.log('\n🧪 Testing Budget Guardrails...');
  console.log(`Making ${NUM_REQUESTS} requests with large text (${LARGE_TEXT.length} chars)`);
  
  // Reset results for budget test
  results = {
    successful: 0,
    rateLimited: 0,
    budgetExceeded: 0,
    errors: 0,
    responses: []
  };
  
  for (let i = 1; i <= NUM_REQUESTS; i++) {
    await makeRequest(LARGE_TEXT, i);
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }
}

/**
 * Test guardrails status endpoint
 */
async function testGuardrailsStatus() {
  console.log('\n🧪 Testing Guardrails Status Endpoint...');
  
  return new Promise((resolve) => {
    const req = http.request(`${BASE_URL}/api/guardrails-status`, { method: 'GET' }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const status = JSON.parse(body);
            console.log('📊 Guardrails Status:');
            console.log(`   User ID: ${status.userId}`);
            console.log(`   Rate Limit - User Tokens: ${status.status.rateLimiting.user.tokens}`);
            console.log(`   Rate Limit - Global Tokens: ${status.status.rateLimiting.global.tokens}`);
            console.log(`   Budget - Daily Chars: ${status.status.budget.dailyChars}`);
            console.log(`   Budget - Monthly Chars: ${status.status.budget.monthlyChars}`);
            console.log(`   Budget - Total Cost: $${status.status.budget.totalCost.toFixed(4)}`);
          } catch (e) {
            console.log('❌ Failed to parse status response');
          }
        } else {
          console.log(`❌ Status endpoint returned ${res.statusCode}`);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Status endpoint error: ${err.message}`);
      resolve();
    });

    req.end();
  });
}

/**
 * Print test summary
 */
function printSummary() {
  console.log('\n📊 Test Summary:');
  console.log(`   Total Requests: ${results.responses.length}`);
  console.log(`   Successful: ${results.successful}`);
  console.log(`   Rate Limited: ${results.rateLimited}`);
  console.log(`   Budget Exceeded: ${results.budgetExceeded}`);
  console.log(`   Errors: ${results.errors}`);
  
  if (results.responses.length > 0) {
    const avgResponseTime = results.responses.reduce((sum, r) => sum + r.responseTime, 0) / results.responses.length;
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  }
  
  console.log('\n🎯 Expected Behavior:');
  console.log('   - First 10 requests should succeed (rate limit burst)');
  console.log('   - Subsequent requests should be rate limited (429 status)');
  console.log('   - Large text requests should be budget limited (429 status)');
  console.log('   - Status endpoint should show current limits and usage');
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Guardrails Load Test');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Requests: ${NUM_REQUESTS}`);
  console.log(`   Delay: ${DELAY_MS}ms`);
  
  try {
    // Test rate limiting
    await testRateLimiting();
    printSummary();
    
    // Test budget guardrails
    await testBudgetGuardrails();
    printSummary();
    
    // Test status endpoint
    await testGuardrailsStatus();
    
    console.log('\n✅ Load testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, makeRequest, testRateLimiting, testBudgetGuardrails };
