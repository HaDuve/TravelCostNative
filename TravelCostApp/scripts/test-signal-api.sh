#!/bin/bash

# Signal CLI REST API Test Script
# This script tests the Signal CLI REST API connection and functionality

set -e

SIGNAL_API_URL=${1:-"http://localhost:8080"}
PHONE_NUMBER=${2:-""}

echo "🧪 Testing Signal CLI REST API..."
echo "API URL: $SIGNAL_API_URL"

# Test 1: Check if API is running
echo ""
echo "1️⃣ Testing API health..."
if curl -s "$SIGNAL_API_URL/v1/about" > /dev/null; then
    echo "✅ API is running and accessible"
else
    echo "❌ API is not accessible at $SIGNAL_API_URL"
    echo "   Make sure the Signal CLI server is running:"
    echo "   docker-compose -f docker-compose.signal.yml up -d"
    exit 1
fi

# Test 2: Get API version info
echo ""
echo "2️⃣ Getting API version info..."
VERSION_INFO=$(curl -s "$SIGNAL_API_URL/v1/about")
echo "📋 API Info: $VERSION_INFO"

# Test 3: List registered accounts (if any)
echo ""
echo "3️⃣ Checking registered accounts..."
ACCOUNTS=$(curl -s "$SIGNAL_API_URL/v1/accounts" 2>/dev/null || echo "[]")
echo "📱 Registered accounts: $ACCOUNTS"

# Test 4: Test message sending (if phone number provided)
if [ -n "$PHONE_NUMBER" ]; then
    echo ""
    echo "4️⃣ Testing message sending..."
    echo "📞 Sending test message to $PHONE_NUMBER..."

    # Create test message payload
    TEST_MESSAGE="🧪 Test message from Signal CLI API - $(date)"

    # Send test message
    RESPONSE=$(curl -s -X POST "$SIGNAL_API_URL/v2/send" \
        -H "Content-Type: application/json" \
        -d "{
            \"message\": \"$TEST_MESSAGE\",
            \"number\": \"$PHONE_NUMBER\",
            \"recipients\": [\"$PHONE_NUMBER\"]
        }" 2>/dev/null || echo "Error sending message")

    if echo "$RESPONSE" | grep -q "error"; then
        echo "❌ Failed to send test message: $RESPONSE"
        echo "   Make sure the phone number is registered and verified"
    else
        echo "✅ Test message sent successfully!"
        echo "   Check your Signal app for the test message"
    fi
else
    echo ""
    echo "4️⃣ Skipping message test (no phone number provided)"
    echo "   To test message sending, run:"
    echo "   ./scripts/test-signal-api.sh $SIGNAL_API_URL +1234567890"
fi

echo ""
echo "🎉 Signal CLI API testing complete!"
echo ""
echo "📖 For troubleshooting, see: docs/signal-cli-setup-guide.md"
