# Firebase Cloud Functions Development Guide

This guide documents how to create and implement Cloud Functions with Firebase Realtime Database for the TravelCost App project.

## Project Structure

```
TravelCostApp/
├── firebase.json              # Firebase project configuration
├── .firebaserc               # Firebase project aliases
├── functions/                # Cloud Functions directory
│   ├── package.json          # Functions dependencies
│   ├── tsconfig.json         # TypeScript configuration
│   ├── src/
│   │   └── index.ts          # Main functions file
│   └── lib/                  # Compiled JavaScript (auto-generated)
└── .rules                    # Database security rules
```

## Prerequisites

### Required Software

- Node.js 18+ (Cloud Functions runtime requirement)
- Firebase CLI (`npm install -g firebase-tools`)
- TypeScript (included in functions dependencies)

### Firebase Project Setup

- Firebase project: `travelcostnative`
- Database: Firebase Realtime Database
- Region: `asia-southeast1`

## Initial Setup

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Authenticate with Firebase

```bash
firebase login
```

### 3. Initialize Functions (if starting fresh)

```bash
firebase init functions
```

### 4. Install Dependencies

```bash
cd functions
npm install
```

## Development Workflow

### 1. Local Development

```bash
# Build TypeScript
npm run build

# Watch for changes
npm run build:watch

# Start local emulator
npm run serve
```

### 2. Testing Functions

```bash
# Test with Firebase emulator
firebase emulators:start --only functions,database

# View function logs
firebase functions:log
```

### 3. Deployment

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:functionName
```

## Function Types and Triggers

### Database Triggers

```typescript
import * as functions from "firebase-functions";

// Trigger on data creation
export const onDataCreated = functions.database
  .ref("/path/{id}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.val();
    const id = context.params.id;
    // Process data...
  });

// Trigger on data updates
export const onDataUpdated = functions.database
  .ref("/path/{id}")
  .onUpdate(async (change, context) => {
    const before = change.before.val();
    const after = change.after.val();
    // Process changes...
  });

// Trigger on data deletion
export const onDataDeleted = functions.database
  .ref("/path/{id}")
  .onDelete(async (snapshot, context) => {
    const data = snapshot.val();
    // Process deletion...
  });
```

### HTTP Triggers

```typescript
import * as functions from "firebase-functions";

export const httpFunction = functions.https.onRequest((req, res) => {
  // Handle HTTP request
  res.send("Hello from Firebase!");
});
```

## Configuration Management

### Environment Variables

```typescript
// Access configuration
const config = functions.config();
const apiKey = config.external.api_key;

// Or use environment variables
const apiKey = process.env.EXTERNAL_API_KEY;
```

### Setting Configuration

```bash
# Set configuration values
firebase functions:config:set external.api_key="your-api-key"
firebase functions:config:set signal.api_url="https://your-signal-api.com"
```

## Database Security Rules

### Example Rules for Functions

```json
{
  "rules": {
    "server": {
      "feedback": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

## Error Handling Best Practices

### 1. Logging

```typescript
import * as functions from "firebase-functions";

export const myFunction = functions.database
  .ref("/path/{id}")
  .onCreate(async (snapshot, context) => {
    try {
      // Function logic
      functions.logger.info("Function executed successfully", {
        id: context.params.id,
        timestamp: Date.now(),
      });
    } catch (error) {
      functions.logger.error("Function failed", {
        error: error instanceof Error ? error.message : String(error),
        id: context.params.id,
      });
      // Don't throw error to avoid retries unless necessary
    }
  });
```

### 2. Retry Logic

```typescript
async function retryOperation(
  operation: () => Promise<any>,
  maxRetries = 3
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## External API Integration

### Example: Signal CLI Integration

```typescript
import axios from "axios";

async function sendSignalNotification(message: string): Promise<void> {
  const payload = {
    message: message,
    number: process.env.SIGNAL_SENDER,
    recipients: [process.env.SIGNAL_RECIPIENT],
  };

  const response = await axios.post(
    `${process.env.SIGNAL_API_URL}/v2/send`,
    payload,
    {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    }
  );

  if (response.status !== 201) {
    throw new Error(`API returned status ${response.status}`);
  }
}
```

## Monitoring and Debugging

### 1. View Logs

```bash
# Real-time logs
firebase functions:log --follow

# Specific function logs
firebase functions:log --only onFeedbackCreated
```

### 2. Firebase Console

- Go to Firebase Console → Functions
- View execution history, errors, and performance metrics
- Set up alerts for function failures

### 3. Local Debugging

```bash
# Start emulator with debug info
firebase emulators:start --only functions --inspect-functions
```

## Common Patterns

### 1. Data Validation

```typescript
function validateData(data: any): boolean {
  return data && typeof data.field === "string" && data.field.length > 0;
}
```

### 2. Batch Operations

```typescript
import * as admin from "firebase-admin";

async function batchUpdate(updates: Record<string, any>): Promise<void> {
  const db = admin.database();
  const ref = db.ref();
  await ref.update(updates);
}
```

### 3. Conditional Processing

```typescript
export const conditionalFunction = functions.database
  .ref("/path/{id}")
  .onWrite(async (change, context) => {
    const before = change.before.val();
    const after = change.after.val();

    // Only process if data actually changed
    if (before === after) return null;

    // Process the change...
  });
```

## Performance Considerations

### 1. Memory Management

- Keep functions lightweight
- Avoid storing large objects in memory
- Use streaming for large data processing

### 2. Timeout Handling

- Set appropriate timeouts for external API calls
- Use background processing for long-running tasks
- Consider using Cloud Tasks for complex workflows

### 3. Cold Start Optimization

- Minimize dependencies
- Use connection pooling for external services
- Consider function warming strategies

## Security Best Practices

### 1. Input Validation

```typescript
function sanitizeInput(input: any): string {
  if (typeof input !== "string") return "";
  return input.trim().substring(0, 1000); // Limit length
}
```

### 2. Authentication

```typescript
export const authenticatedFunction = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }
    // Process authenticated request...
  }
);
```

### 3. Rate Limiting

```typescript
const rateLimit = new Map();

function checkRateLimit(identifier: string, limit: number = 10): boolean {
  const now = Date.now();
  const userRequests = rateLimit.get(identifier) || [];
  const recentRequests = userRequests.filter(
    (time: number) => now - time < 60000
  );

  if (recentRequests.length >= limit) {
    return false;
  }

  recentRequests.push(now);
  rateLimit.set(identifier, recentRequests);
  return true;
}
```

## Troubleshooting

### Common Issues

1. **Function not triggering**

   - Check database security rules
   - Verify trigger path matches exactly
   - Check function deployment status

2. **Timeout errors**

   - Increase function timeout in firebase.json
   - Optimize external API calls
   - Consider breaking into smaller functions

3. **Memory errors**

   - Reduce function memory usage
   - Use streaming for large data
   - Check for memory leaks

4. **Authentication errors**
   - Verify Firebase project configuration
   - Check service account permissions
   - Ensure proper initialization

### Debug Commands

```bash
# Check function status
firebase functions:list

# View specific function details
firebase functions:describe functionName

# Test function locally
firebase functions:shell
```

## Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database rules updated
- [ ] Function timeouts appropriate
- [ ] Error handling implemented
- [ ] Logging added
- [ ] Documentation updated
- [ ] Monitoring configured

## Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Realtime Database Triggers](https://firebase.google.com/docs/database/extend-with-functions)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Cloud Functions Best Practices](https://firebase.google.com/docs/functions/best-practices)
