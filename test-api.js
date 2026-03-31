/**
 * API Test Script - Verify All Endpoints Working
 * 
 * Tests the existing API with seeded OEM parts data
 * Covers: Models, Parts, Search, Pagination
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
const API = '/api';

// ANSI Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

async function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'API-Tester'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function test(name, path, expectedStatus = 200) {
  try {
    console.log(`\n📋 Testing: ${name}`);
    console.log(`   Endpoint: GET ${API}${path}`);
    
    const result = await makeRequest(`${API}${path}`);
    
    if (result.status === expectedStatus) {
      console.log(`   ${colors.green}✅ Status: ${result.status}${colors.reset}`);
      
      if (result.data && typeof result.data === 'object') {
        if (result.data.data && Array.isArray(result.data.data)) {
          console.log(`   ${colors.green}✅ Items: ${result.data.data.length}${colors.reset}`);
        } else if (result.data.success !== undefined) {
          console.log(`   ${colors.green}✅ Response: ${result.data.message || 'Success'}${colors.reset}`);
        } else if (Array.isArray(result.data)) {
          console.log(`   ${colors.green}✅ Items: ${result.data.length}${colors.reset}`);
        } else if (result.data.results && Array.isArray(result.data.results)) {
          console.log(`   ${colors.green}✅ Results: ${result.data.results.length}${colors.reset}`);
        }
      }
      return true;
    } else {
      console.log(`   ${colors.red}❌ Status: ${result.status} (expected ${expectedStatus})${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function runTests() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║ Opel OEM Intelligence Portal - API Test Suite         ║
╚════════════════════════════════════════════════════════╝
  `);

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  console.log(`\n${colors.blue}━━━ System Health ━━━${colors.reset}`);
  if (await test('Health Check', '/health')) passed++; else failed++;

  // Test 2: Models
  console.log(`\n${colors.blue}━━━ Vehicle Models ━━━${colors.reset}`);
  if (await test('List All Models', '/models')) passed++; else failed++;
  if (await test('Model Catalog', '/catalog')) passed++; else failed++;

  // Test 3: Parts Discovery
  console.log(`\n${colors.blue}━━━ Parts & Catalog ━━━${colors.reset}`);
  if (await test('List All Parts', '/parts')) passed++; else failed++;
  if (await test('Parts by Model', '/parts?model=Opel%20Corsa')) passed++; else failed++;
  if (await test('Scraped Parts Models', '/scraped-parts/models')) passed++; else failed++;
  if (await test('Corsa Categories', '/scraped-parts/Opel%20Corsa/categories')) passed++; else failed++;

  // Test 4: Search & Lookup
  console.log(`\n${colors.blue}━━━ Search & Lookup ━━━${colors.reset}`);
  if (await test('Search Parts', '/scraped-parts/search?q=engine')) passed++; else failed++;
  if (await test('Search by OEM', '/scraped-parts/by-oemNumber/1628-451-007')) passed++; else failed++;

  // Test 5: Statistics
  console.log(`\n${colors.blue}━━━ Statistics ━━━${colors.reset}`);
  if (await test('Parts Statistics', '/scraped-parts/stats')) passed++; else failed++;

  // Summary
  console.log(`\n╔════════════════════════════════════════════════════════╗`);
  console.log(`║ Test Results                                           ║`);
  console.log(`╠════════════════════════════════════════════════════════╣`);
  console.log(`║ ${colors.green}✅ Passed: ${String(passed).padEnd(44)}${colors.reset}║`);
  console.log(`║ ${colors.red}❌ Failed: ${String(failed).padEnd(44)}${colors.reset}║`);
  console.log(`║ Total:  ${String(passed + failed).padEnd(45)}║`);
  console.log(`╚════════════════════════════════════════════════════════╝`);

  if (failed === 0) {
    console.log(`\n${colors.green}🎉 All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}⚠️  ${failed} test(s) failed. Check server logs.${colors.reset}\n`);
    process.exit(1);
  }
}

// Wait a second for server to be fully ready
setTimeout(runTests, 1000);
