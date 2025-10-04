# Quick Start: Signal CLI Setup

This is a quick start guide to get Signal CLI REST API running for Firebase Cloud Functions notifications.

## 🚀 Quick Setup (5 minutes)

### 1. Start Signal CLI Server

```bash
# Run the automated setup script
./scripts/setup-signal-cli.sh
```

### 2. Register Your Phone Number

```bash
# Replace +1234567890 with your actual phone number
curl -X POST "http://localhost:8080/v1/register/+1234567890"

# Check your phone for SMS code, then verify
curl -X POST "http://localhost:8080/v1/register/+1234567890/verify/123456"
```

### 3. Test the Setup

```bash
# Test the API
./scripts/test-signal-api.sh

# Test with your phone number
./scripts/test-signal-api.sh http://localhost:8080 +1234567890
```

### 4. Configure Firebase Functions

```bash
# Set configuration (replace with your phone number)
firebase functions:config:set signal.api_url="http://localhost:8080"
firebase functions:config:set signal.sender="+1234567890"
firebase functions:config:set signal.recipient="+1234567890"
```

### 5. Deploy and Test

```bash
# Deploy functions
firebase deploy --only functions

# Submit feedback through your app and check for Signal notification!
```

## ✅ Verification

You should receive a Signal message like this:

```
🚨 New Feedback Received

User: test-user-123
Date: 1/27/2025, 11:30:00 PM
Platform: iOS
Version: 1.3.001

Feedback:
This is a test feedback message.

---
TravelCost App
```

## 🆘 Troubleshooting

**Server won't start?**

```bash
docker-compose -f docker-compose.signal.yml logs
```

**Registration fails?**

- Check phone number format: `+1234567890`
- Ensure you can receive SMS
- Try different verification methods

**No Signal message received?**

- Check Firebase Functions logs: `firebase functions:log --only onFeedbackCreated`
- Verify both phone numbers are registered Signal users
- Test API directly: `./scripts/test-signal-api.sh http://localhost:8080 +1234567890`

## 📚 Full Documentation

For detailed setup instructions, troubleshooting, and production deployment:

- [Complete Setup Guide](signal-cli-setup-guide.md)
- [Setup Checklist](signal-setup-checklist.md)
- [Firebase Functions Guide](../firebase-cloud-functions-guide.md)
