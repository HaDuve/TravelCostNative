# SMS API Integration Guide

This guide covers setting up direct SMS API integration for Firebase Cloud Functions, replacing the Signal CLI approach with reliable SMS services.

## Overview

Instead of running Signal CLI, we now use direct SMS API services that integrate seamlessly with Firebase Cloud Functions. This approach is more reliable, scalable, and cost-effective.

## Supported SMS Services

### 1. Twilio (Recommended)
- **Reliability**: 99.95% uptime SLA
- **Global Coverage**: 200+ countries
- **Pricing**: $0.0075 per SMS (US), free tier available
- **Features**: Delivery reports, webhooks, advanced routing

### 2. Vonage (Nexmo)
- **Reliability**: Enterprise-grade
- **Global Coverage**: 200+ countries
- **Pricing**: $0.0055 per SMS (US)
- **Features**: Advanced analytics, A2P 10DLC support

### 3. TextBelt
- **Reliability**: Good for development
- **Global Coverage**: Limited
- **Pricing**: Free tier (1 SMS/day), $0.10 per SMS
- **Features**: Simple API, good for testing

### 4. Custom API
- **Flexibility**: Use any SMS provider
- **Integration**: Custom headers and authentication
- **Pricing**: Varies by provider

## Quick Setup

### Option 1: Twilio (Recommended)

#### Step 1: Create Twilio Account
1. Go to [twilio.com](https://www.twilio.com)
2. Sign up for a free account
3. Verify your phone number
4. Get your Account SID and Auth Token from the console

#### Step 2: Get a Phone Number
1. In Twilio Console, go to Phone Numbers → Manage → Buy a number
2. Choose a number with SMS capabilities
3. Note the phone number (format: +1234567890)

#### Step 3: Configure Firebase Functions
```bash
# Set SMS API type
firebase functions:config:set sms.api_type="twilio"

# Set Twilio credentials
firebase functions:config:set twilio.account_sid="YOUR_ACCOUNT_SID"
firebase functions:config:set twilio.auth_token="YOUR_AUTH_TOKEN"
firebase functions:config:set twilio.phone_number="+1234567890"

# Set recipient phone number
firebase functions:config:set sms.recipient="+YOUR_PHONE_NUMBER"
```

#### Step 4: Deploy and Test
```bash
# Deploy functions
firebase deploy --only functions

# Test with feedback submission
# Check logs
firebase functions:log --only onFeedbackCreated
```

### Option 2: TextBelt (Free Testing)

#### Step 1: Configure Firebase Functions
```bash
# Set SMS API type
firebase functions:config:set sms.api_type="textbelt"

# Set recipient phone number
firebase functions:config:set sms.recipient="+YOUR_PHONE_NUMBER"

# Optional: Set API key for higher limits
firebase functions:config:set sms.api_key="YOUR_TEXTBELT_KEY"
```

#### Step 2: Deploy and Test
```bash
# Deploy functions
firebase deploy --only functions

# Test with feedback submission
```

### Option 3: Vonage (Nexmo)

#### Step 1: Create Vonage Account
1. Go to [developer.vonage.com](https://developer.vonage.com)
2. Sign up for a free account
3. Get your API Key and API Secret

#### Step 2: Configure Firebase Functions
```bash
# Set SMS API type
firebase functions:config:set sms.api_type="vonage"

# Set Vonage credentials
firebase functions:config:set sms.api_key="YOUR_API_KEY"
firebase functions:config:set vonage.api_secret="YOUR_API_SECRET"

# Set sender and recipient
firebase functions:config:set sms.sender="YOUR_SENDER_NAME"
firebase functions:config:set sms.recipient="+YOUR_PHONE_NUMBER"
```

## Configuration Reference

### Firebase Functions Config

```bash
# SMS API Configuration
firebase functions:config:set sms.api_type="twilio"  # twilio, vonage, textbelt, custom
firebase functions:config:set sms.recipient="+1234567890"

# Twilio Configuration
firebase functions:config:set twilio.account_sid="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
firebase functions:config:set twilio.auth_token="your_auth_token"
firebase functions:config:set twilio.phone_number="+1234567890"

# Vonage Configuration
firebase functions:config:set sms.api_key="your_api_key"
firebase functions:config:set vonage.api_secret="your_api_secret"
firebase functions:config:set sms.sender="YourApp"

# TextBelt Configuration
firebase functions:config:set sms.api_key="textbelt"  # or your paid key

# Custom API Configuration
firebase functions:config:set sms.api_url="https://your-api.com/send"
firebase functions:config:set sms.api_key="your_api_key"
firebase functions:config:set sms.sender="YourApp"
```

### Environment Variables (Alternative)

You can also use environment variables instead of Firebase config:

```bash
# Set environment variables
export SMS_API_TYPE="twilio"
export SMS_RECIPIENT="+1234567890"
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="your_auth_token"
export TWILIO_PHONE_NUMBER="+1234567890"
```

## Testing

### Test SMS Sending

Create a test script `test-sms.js`:

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

// Test data
const testFeedback = {
  uid: "test-user-123",
  feedbackString: "This is a test feedback message for SMS integration.",
  date: new Date().toISOString(),
  timestamp: Date.now(),
  userAgent: "Test Script",
  version: "1.0.0"
};

async function testSMS() {
  try {
    console.log("Creating test feedback...");
    
    // Create a test feedback entry
    const feedbackRef = db.ref('/server/feedback').push();
    await feedbackRef.set(testFeedback);
    
    console.log("✅ Test feedback created successfully!");
    console.log("Feedback ID:", feedbackRef.key);
    console.log("Check your phone for SMS notification!");
    
    // Clean up after 10 seconds
    setTimeout(async () => {
      await feedbackRef.remove();
      console.log("🧹 Test feedback cleaned up");
      process.exit(0);
    }, 10000);
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testSMS();
```

Run the test:
```bash
node test-sms.js
```

### Check Function Logs

```bash
# View real-time logs
firebase functions:log --follow

# View specific function logs
firebase functions:log --only onFeedbackCreated

# View logs with filtering
firebase functions:log --only onFeedbackCreated --limit 50
```

## Cost Comparison

### Twilio
- **Free Tier**: $15 credit (≈ 2000 SMS)
- **Paid**: $0.0075 per SMS (US)
- **Monthly Cost**: $0-15 for typical usage

### Vonage
- **Free Tier**: $2 credit (≈ 400 SMS)
- **Paid**: $0.0055 per SMS (US)
- **Monthly Cost**: $0-10 for typical usage

### TextBelt
- **Free Tier**: 1 SMS per day
- **Paid**: $0.10 per SMS
- **Monthly Cost**: $0-3 for typical usage

### Estimated Monthly Costs
- **Low usage** (< 100 feedback/month): $0-5
- **Medium usage** (100-1000 feedback/month): $5-15
- **High usage** (> 1000 feedback/month): $15-50

## Troubleshooting

### Common Issues

1. **SMS not received**
   - Check phone number format (+countrycode)
   - Verify SMS service configuration
   - Check function logs for errors
   - Ensure sufficient credits/balance

2. **Authentication errors**
   - Verify API credentials
   - Check Firebase Functions config
   - Ensure proper permissions

3. **Rate limiting**
   - Check SMS service limits
   - Implement retry logic
   - Consider upgrading plan

4. **Function timeout**
   - Check SMS service response time
   - Increase function timeout if needed
   - Monitor function performance

### Debug Commands

```bash
# Check Firebase Functions config
firebase functions:config:get

# View function logs
firebase functions:log --only onFeedbackCreated

# Test function locally
firebase functions:shell

# Check function status
firebase functions:list
```

## Security Best Practices

1. **Secure Credentials**
   - Use Firebase Functions config, not hardcoded values
   - Rotate API keys regularly
   - Monitor for unauthorized usage

2. **Rate Limiting**
   - Implement rate limiting in your function
   - Monitor for abuse
   - Set up alerts for unusual activity

3. **Input Validation**
   - Validate phone numbers
   - Sanitize message content
   - Limit message length

4. **Monitoring**
   - Set up error alerting
   - Monitor function performance
   - Track SMS delivery rates

## Migration from Signal CLI

If you're migrating from Signal CLI:

1. **Choose SMS Service**: Select Twilio, Vonage, or TextBelt
2. **Update Configuration**: Set new Firebase Functions config
3. **Deploy Functions**: Deploy updated Cloud Functions
4. **Test Integration**: Verify SMS notifications work
5. **Decommission Signal CLI**: Remove local Signal CLI setup

## Next Steps

1. **Choose your SMS service** based on your needs
2. **Set up the service** and get credentials
3. **Configure Firebase Functions** with the credentials
4. **Deploy and test** the integration
5. **Monitor and optimize** based on usage

This direct API approach provides a much more reliable and scalable solution compared to running Signal CLI locally or in the cloud.
