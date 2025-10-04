#!/bin/bash

# Test script for currency exchange APIs
# This script tests the currency exchange APIs and provides detailed output

echo "🚀 Currency Exchange API Test Script"
echo "===================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to run this test."
    exit 1
fi

# Check if axios is available
if ! node -e "require('axios')" 2>/dev/null; then
    echo "📦 Installing axios..."
    npm install axios
fi

# Set up environment variables if not set
if [ -z "$EXCHANGE_API_KEY" ]; then
    echo "⚠️  EXCHANGE_API_KEY not set. Using placeholder."
    export EXCHANGE_API_KEY="your-api-key-here"
fi

if [ -z "$FREEEXCHANGE_API_KEY" ]; then
    echo "⚠️  FREEEXCHANGE_API_KEY not set. Using placeholder."
    export FREEEXCHANGE_API_KEY="your-api-key-here"
fi

echo "🔑 API Keys:"
echo "   EXCHANGE_API_KEY: ${EXCHANGE_API_KEY:0:10}..."
echo "   FREEEXCHANGE_API_KEY: ${FREEEXCHANGE_API_KEY:0:10}..."

echo ""
echo "🧪 Running API tests..."
echo ""

# Run the test script
node scripts/test-currency-apis.js

echo ""
echo "✅ Test script completed!"
echo ""
echo "💡 To test with real API keys:"
echo "   export EXCHANGE_API_KEY='your-real-key'"
echo "   export FREEEXCHANGE_API_KEY='your-real-key'"
echo "   ./scripts/test-currency-apis.sh"
