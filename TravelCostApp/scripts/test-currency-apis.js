#!/usr/bin/env node

/**
 * Test script for currency exchange APIs
 * Tests both API1 (exchangeratesapi.io) and API2 (currencyapi.com)
 */

const axios = require('axios');

// Test currency pairs
const testPairs = [
  { base: 'EUR', target: 'MYR' },
  { base: 'USD', target: 'EUR' },
  { base: 'GBP', target: 'JPY' },
  { base: 'EUR', target: 'USD' },
  { base: 'USD', target: 'MYR' },
  { base: 'EUR', target: 'GBP' }
];

// Mock API keys for testing (replace with real ones if available)
const API1_KEY = process.env.EXCHANGE_API_KEY || 'your-api-key-here';
const API2_KEY = process.env.FREEEXCHANGE_API_KEY || 'your-api-key-here';

async function testAPI1(base, target) {
  console.log(`\n🔍 Testing API1 (exchangeratesapi.io): ${base} → ${target}`);
  
  try {
    const requestURL = `http://api.exchangeratesapi.io/v1/latest?access_key=${API1_KEY}&base=${base}`;
    console.log(`Request URL: ${requestURL.replace(API1_KEY, '***')}`);
    
    const response = await axios.get(requestURL);
    console.log(`✅ API1 Response Status: ${response.status}`);
    console.log(`📊 Response data structure:`, {
      success: response.data.success,
      base: response.data.base,
      date: response.data.date,
      ratesCount: response.data.rates ? Object.keys(response.data.rates).length : 0
    });
    
    if (response.data.rates && response.data.rates[target]) {
      console.log(`✅ Found rate for ${target}: ${response.data.rates[target]}`);
      return { success: true, rate: response.data.rates[target], rates: response.data.rates };
    } else {
      console.log(`❌ Target currency ${target} not found in rates`);
      console.log(`Available currencies:`, Object.keys(response.data.rates || {}).slice(0, 10).join(', '), '...');
      return { success: false, rates: response.data.rates };
    }
  } catch (error) {
    console.log(`❌ API1 Error:`, error.response?.status, error.response?.statusText || error.message);
    if (error.response?.data) {
      console.log(`Error details:`, error.response.data);
    }
    return { success: false, error: error.message };
  }
}

async function testAPI2(base, target) {
  console.log(`\n🔍 Testing API2 (currencyapi.com): ${base} → ${target}`);
  
  try {
    const requestURL = `https://api.currencyapi.com/v3/latest?apikey=${API2_KEY}&currencies=${target}&base_currency=${base}`;
    console.log(`Request URL: ${requestURL.replace(API2_KEY, '***')}`);
    
    const response = await axios.get(requestURL);
    console.log(`✅ API2 Response Status: ${response.status}`);
    console.log(`📊 Response data structure:`, {
      data: response.data.data ? Object.keys(response.data.data).length : 0,
      meta: response.data.meta
    });
    
    const rate = response?.data?.data?.[target]?.value;
    if (rate) {
      console.log(`✅ Found rate for ${target}: ${rate}`);
      return { success: true, rate: rate };
    } else {
      console.log(`❌ Target currency ${target} not found in response`);
      console.log(`Available currencies:`, Object.keys(response.data.data || {}));
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ API2 Error:`, error.response?.status, error.response?.statusText || error.message);
    if (error.response?.data) {
      console.log(`Error details:`, error.response.data);
    }
    return { success: false, error: error.message };
  }
}

async function testFallbackCalculation(base, target, api1Rates) {
  console.log(`\n🔄 Testing fallback calculation: ${base} → ${target}`);
  
  // Try to calculate using USD as intermediate currency
  const usdRate = api1Rates?.USD;
  const targetFromUsd = api1Rates?.[target];
  
  if (usdRate && targetFromUsd) {
    const calculatedRate = targetFromUsd / usdRate;
    console.log(`✅ Fallback calculation successful:`);
    console.log(`   ${base} → USD: ${usdRate}`);
    console.log(`   USD → ${target}: ${targetFromUsd}`);
    console.log(`   Calculated ${base} → ${target}: ${calculatedRate}`);
    return { success: true, rate: calculatedRate };
  } else {
    console.log(`❌ Fallback calculation not possible`);
    console.log(`   USD rate available: ${!!usdRate}`);
    console.log(`   ${target} from USD available: ${!!targetFromUsd}`);
    return { success: false };
  }
}

async function runTests() {
  console.log('🚀 Starting Currency Exchange API Tests');
  console.log('=====================================');
  
  for (const pair of testPairs) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Testing: ${pair.base} → ${pair.target}`);
    console.log(`${'='.repeat(50)}`);
    
    // Test API1
    const api1Result = await testAPI1(pair.base, pair.target);
    
    // Test API2
    const api2Result = await testAPI2(pair.base, pair.target);
    
    // Test fallback calculation if API1 succeeded but didn't have target currency
    if (api1Result.success && api1Result.rates && !api1Result.rate) {
      await testFallbackCalculation(pair.base, pair.target, api1Result.rates);
    }
    
    // Summary
    console.log(`\n📋 Summary for ${pair.base} → ${pair.target}:`);
    console.log(`   API1: ${api1Result.success ? '✅' : '❌'} ${api1Result.rate || 'N/A'}`);
    console.log(`   API2: ${api2Result.success ? '✅' : '❌'} ${api2Result.rate || 'N/A'}`);
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log('🏁 Tests completed');
  console.log(`${'='.repeat(50)}`);
}

// Run the tests
runTests().catch(console.error);
