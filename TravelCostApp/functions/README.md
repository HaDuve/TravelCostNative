# Firebase Cloud Functions

This directory contains the Firebase Cloud Functions for the TravelCost App.

## Functions

### `onFeedbackCreated`

Triggers when new feedback is created in the database and sends a Signal notification to the developer.

**Trigger Path**: `/server/feedback/{feedbackId}`
**Runtime**: Node.js 18
**Dependencies**: firebase-functions, firebase-admin, axios

## Development

### Prerequisites

- Node.js 18+
- Firebase CLI
- Firebase project access

### Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch for changes
npm run build:watch
```

### Local Testing

```bash
# Start Firebase emulator
firebase emulators:start --only functions,database

# Test with emulator
npm run serve
```

### Deployment

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:onFeedbackCreated
```

## Configuration

### Environment Variables

Set these in Firebase Functions config or as environment variables:

- `SIGNAL_API_URL` - Signal CLI REST API endpoint
- `SIGNAL_RECIPIENT` - Developer's phone number for notifications
- `SIGNAL_SENDER` - Signal CLI registered number

### Setting Configuration

```bash
firebase functions:config:set signal.api_url="https://your-signal-api.com"
firebase functions:config:set signal.recipient="+1234567890"
firebase functions:config:set signal.sender="+0987654321"
```

## Monitoring

### View Logs

```bash
# All function logs
firebase functions:log

# Specific function logs
firebase functions:log --only onFeedbackCreated

# Follow logs in real-time
firebase functions:log --follow
```

### Firebase Console

- Go to Firebase Console → Functions
- View execution history and performance metrics
- Set up alerts for function failures

## Troubleshooting

### Common Issues

1. **Function not triggering**: Check database security rules and trigger path
2. **Signal API errors**: Verify SIGNAL_API_URL and authentication
3. **Timeout errors**: Check external API response times
4. **Memory errors**: Monitor function memory usage

### Debug Commands

```bash
# Check function status
firebase functions:list

# View function details
firebase functions:describe onFeedbackCreated

# Test function locally
firebase functions:shell
```

## File Structure

```
functions/
├── src/
│   └── index.ts          # Main functions file
├── lib/                  # Compiled JavaScript (auto-generated)
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
├── test-local.js         # Local testing script
└── README.md            # This file
```
