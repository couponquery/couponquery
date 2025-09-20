#!/usr/bin/env node

const ENGINE_URL = process.env.ENGINE_URL || "https://couponcanon.com";

async function testHealth() {
  try {
    console.log(`Testing ${ENGINE_URL}/api/health...`);
    const response = await fetch(`${ENGINE_URL}/api/health`);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Keys: ${Object.keys(data).join(', ')}`);
    console.log(`OK: ${data.ok}`);
    console.log(`Uptime: ${data.uptime_ms}ms`);
    console.log(`Env: ${data.env}`);
    
    return response.status === 200 && data.ok === true;
  } catch (error) {
    console.error(`Health test failed: ${error.message}`);
    return false;
  }
}

async function testBrand() {
  try {
    console.log(`\nTesting ${ENGINE_URL}/api/brand?brand=demo...`);
    const response = await fetch(`${ENGINE_URL}/api/brand?brand=demo`);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Keys: ${Object.keys(data).join(', ')}`);
    console.log(`Brand: ${data.brand}`);
    console.log(`Count: ${data.count}`);
    console.log(`Codes: ${data.codes ? data.codes.length : 0}`);
    
    return response.status === 200 && data.brand === "demo";
  } catch (error) {
    console.error(`Brand test failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("Running API smoke tests...\n");
  
  const healthOk = await testHealth();
  const brandOk = await testBrand();
  
  console.log(`\nResults:`);
  console.log(`Health endpoint: ${healthOk ? 'PASS' : 'FAIL'}`);
  console.log(`Brand endpoint: ${brandOk ? 'PASS' : 'FAIL'}`);
  
  if (healthOk && brandOk) {
    console.log("\n✅ All tests passed!");
    process.exit(0);
  } else {
    console.log("\n❌ Some tests failed!");
    process.exit(1);
  }
}

runTests();
