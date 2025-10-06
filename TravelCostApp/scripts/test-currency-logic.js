#!/usr/bin/env node

/**
 * Test script for currency exchange logic
 * Tests the new logic without requiring API keys
 */

// Mock the dependencies
const mockMMKV = {
  data: {},
  getObject: key => mockMMKV.data[key],
  setObject: (key, value) => {
    mockMMKV.data[key] = value;
  },
  getString: key => mockMMKV.data[key],
  setString: (key, value) => {
    mockMMKV.data[key] = value;
  },
};

const mockAsyncStore = {
  data: {},
  getItem: async key => mockAsyncStore.data[key],
  setItem: async (key, value) => {
    mockAsyncStore.data[key] = value;
  },
};

const mockSecureStore = {
  data: {},
  getItem: async key => mockSecureStore.data[key],
};

// Mock console.log to capture output
const originalConsoleLog = console.log;
const logs = [];
console.log = (...args) => {
  logs.push(args.join(" "));
  originalConsoleLog(...args);
};

// Mock safeLogError
const errors = [];
const safeLogError = (message, file, line) => {
  errors.push({ message, file, line });
  console.log(`ERROR: ${message} in ${file}:${line}`);
};

// Test scenarios
const testScenarios = [
  {
    name: "Online with cached data",
    isOnline: true,
    hasCachedData: true,
    cachedRate: 4.5,
    expectedResult: 4.5,
    shouldLogError: false,
  },
  {
    name: "Online without cached data",
    isOnline: true,
    hasCachedData: false,
    expectedResult: -1,
    shouldLogError: false,
  },
  {
    name: "Offline with cached data",
    isOnline: false,
    hasCachedData: true,
    cachedRate: 4.2,
    expectedResult: 4.2,
    shouldLogError: false,
  },
  {
    name: "Offline without cached data",
    isOnline: false,
    hasCachedData: false,
    expectedResult: -1,
    shouldLogError: true,
  },
];

// Simulate the new logic
function simulateGetRate(base, target, isOnline, hasCachedData, cachedRate) {
  // Clear previous logs/errors
  logs.length = 0;
  errors.length = 0;

  if (!isOnline) {
    // Offline scenario
    if (hasCachedData && cachedRate) {
      return cachedRate;
    } else {
      safeLogError(
        `Unable to get offline rate for ${base} ${target}`,
        "currencyExchange.ts",
        137
      );
      return -1;
    }
  } else {
    // Online scenario
    if (hasCachedData && cachedRate) {
      console.log(`Using cached rate for ${base} -> ${target}: ${cachedRate}`);
      return cachedRate;
    } else {
      return -1;
    }
  }
}

// Run tests
console.log("🧪 Testing Currency Exchange Logic");
console.log("==================================");

testScenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}`);
  console.log("-".repeat(50));

  const result = simulateGetRate(
    "EUR",
    "MYR",
    scenario.isOnline,
    scenario.hasCachedData,
    scenario.cachedRate
  );

  console.log(`Result: ${result}`);
  console.log(`Expected: ${scenario.expectedResult}`);
  console.log(`Match: ${result === scenario.expectedResult ? "✅" : "❌"}`);

  const hasError = errors.length > 0;
  console.log(`Error logged: ${hasError ? "✅" : "❌"}`);
  console.log(`Should log error: ${scenario.shouldLogError ? "Yes" : "No"}`);
  console.log(
    `Error logging correct: ${hasError === scenario.shouldLogError ? "✅" : "❌"}`
  );

  if (errors.length > 0) {
    console.log(`Error message: ${errors[0].message}`);
  }
});

console.log("\n📊 Summary");
console.log("==========");
console.log(`Total tests: ${testScenarios.length}`);
console.log(
  `Errors logged when online: ${errors.filter(e => e.message.includes("offline")).length}`
);
console.log(`Expected: 0 (no offline errors when online)`);

// Restore console.log
console.log = originalConsoleLog;
