#!/bin/bash

# SMS API Integration Setup Script
# This script helps set up direct SMS API integration for Firebase Cloud Functions

set -e

echo "📱 Setting up SMS API Integration for Firebase Cloud Functions..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "   firebase login"
    exit 1
fi

echo ""
echo "Choose your SMS service:"
echo "1) Twilio (Recommended - Most reliable)"
echo "2) TextBelt (Free for testing)"
echo "3) Vonage (Nexmo)"
echo "4) Custom API"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🔧 Setting up Twilio integration..."
        echo ""
        echo "Please provide your Twilio credentials:"
        echo "You can find these in your Twilio Console:"
        echo "https://console.twilio.com/"
        echo ""
        
        read -p "Enter Twilio Account SID: " TWILIO_ACCOUNT_SID
        read -p "Enter Twilio Auth Token: " TWILIO_AUTH_TOKEN
        read -p "Enter Twilio Phone Number (e.g., +1234567890): " TWILIO_PHONE_NUMBER
        read -p "Enter recipient phone number (e.g., +1234567890): " RECIPIENT_PHONE
        
        echo ""
        echo "📝 Configuring Firebase Functions..."
        
        firebase functions:config:set sms.api_type="twilio"
        firebase functions:config:set sms.recipient="$RECIPIENT_PHONE"
        firebase functions:config:set twilio.account_sid="$TWILIO_ACCOUNT_SID"
        firebase functions:config:set twilio.auth_token="$TWILIO_AUTH_TOKEN"
        firebase functions:config:set twilio.phone_number="$TWILIO_PHONE_NUMBER"
        
        echo "✅ Twilio configuration complete!"
        ;;
        
    2)
        echo ""
        echo "🔧 Setting up TextBelt integration..."
        echo ""
        
        read -p "Enter recipient phone number (e.g., +1234567890): " RECIPIENT_PHONE
        read -p "Enter TextBelt API key (or press Enter for free tier): " TEXTBELT_KEY
        
        echo ""
        echo "📝 Configuring Firebase Functions..."
        
        firebase functions:config:set sms.api_type="textbelt"
        firebase functions:config:set sms.recipient="$RECIPIENT_PHONE"
        
        if [ -n "$TEXTBELT_KEY" ]; then
            firebase functions:config:set sms.api_key="$TEXTBELT_KEY"
        else
            firebase functions:config:set sms.api_key="textbelt"
        fi
        
        echo "✅ TextBelt configuration complete!"
        ;;
        
    3)
        echo ""
        echo "🔧 Setting up Vonage (Nexmo) integration..."
        echo ""
        echo "Please provide your Vonage credentials:"
        echo "You can find these in your Vonage Developer Dashboard:"
        echo "https://developer.vonage.com/"
        echo ""
        
        read -p "Enter Vonage API Key: " VONAGE_API_KEY
        read -p "Enter Vonage API Secret: " VONAGE_API_SECRET
        read -p "Enter sender name: " SENDER_NAME
        read -p "Enter recipient phone number (e.g., +1234567890): " RECIPIENT_PHONE
        
        echo ""
        echo "📝 Configuring Firebase Functions..."
        
        firebase functions:config:set sms.api_type="vonage"
        firebase functions:config:set sms.recipient="$RECIPIENT_PHONE"
        firebase functions:config:set sms.api_key="$VONAGE_API_KEY"
        firebase functions:config:set vonage.api_secret="$VONAGE_API_SECRET"
        firebase functions:config:set sms.sender="$SENDER_NAME"
        
        echo "✅ Vonage configuration complete!"
        ;;
        
    4)
        echo ""
        echo "🔧 Setting up Custom API integration..."
        echo ""
        
        read -p "Enter API URL: " API_URL
        read -p "Enter API Key (optional): " API_KEY
        read -p "Enter sender name: " SENDER_NAME
        read -p "Enter recipient phone number (e.g., +1234567890): " RECIPIENT_PHONE
        
        echo ""
        echo "📝 Configuring Firebase Functions..."
        
        firebase functions:config:set sms.api_type="custom"
        firebase functions:config:set sms.api_url="$API_URL"
        firebase functions:config:set sms.recipient="$RECIPIENT_PHONE"
        firebase functions:config:set sms.sender="$SENDER_NAME"
        
        if [ -n "$API_KEY" ]; then
            firebase functions:config:set sms.api_key="$API_KEY"
        fi
        
        echo "✅ Custom API configuration complete!"
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🚀 Deploying Firebase Functions..."

# Build and deploy functions
cd functions
npm run build
cd ..

firebase deploy --only functions

echo ""
echo "✅ SMS integration setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test the integration by submitting feedback through your app"
echo "2. Check function logs: firebase functions:log --only onFeedbackCreated"
echo "3. Verify you receive SMS notifications"
echo ""
echo "🧪 To test manually, run:"
echo "   node functions/test-sms.js"
echo ""
echo "📖 For more details, see: docs/sms-api-integration-guide.md"
