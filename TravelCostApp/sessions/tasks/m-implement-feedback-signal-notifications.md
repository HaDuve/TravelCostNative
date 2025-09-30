---
task: m-implement-feedback-signal-notifications
branch: feature/implement-feedback-signal-notifications
status: pending
created: 2025-01-27
modules: [firebase-functions, signal-cli, feedback-system]
---

# Implement Cloud Function for Signal Notifications on Feedback

## Problem/Goal

Currently, when users submit feedback through the app, it's stored in Firebase Realtime Database but there's no real-time notification system to alert the developer. We need to implement a Firebase Cloud Function that triggers whenever new feedback is created and sends a Signal message to the developer's phone for immediate awareness.

## Success Criteria

- [ ] Set up Firebase Cloud Functions project structure
- [ ] Install and configure Firebase CLI and Functions SDK
- [ ] Create Cloud Function that triggers on `/server/feedback/{feedbackId}` writes
- [ ] Integrate Signal CLI REST API for sending notifications
- [ ] Deploy Cloud Function to Firebase
- [ ] Test end-to-end flow: user submits feedback → Signal notification sent
- [ ] Handle error cases and retry logic
- [ ] Configure proper Firebase security rules for function access
- [ ] Document setup and deployment process
- [ ] Create comprehensive documentation for future Cloud Functions development with Firebase Realtime Database

## Context Files

- @components/FeedbackForm/FeedbackForm.tsx:68-77 # Feedback submission logic
- @util/http.tsx:952-965 # storeFeedback function
- @sessions/tasks/done/m-implement-feedback-backend.md # Previous feedback implementation

## Technical Requirements

### Firebase Cloud Functions Setup

- Initialize Firebase Functions in the project
- Configure Node.js runtime and dependencies
- Set up proper Firebase project configuration
- Deploy functions to Firebase

### Signal CLI Integration

- Use Signal CLI REST API (https://github.com/bbernhard/signal-cli-rest-api)
- Configure Signal number and recipient
- Handle API authentication and rate limiting
- Implement retry logic for failed sends

### Database Trigger Configuration

- Trigger on Firebase Realtime Database writes to `/server/feedback/{feedbackId}`
- Extract feedback data (user, message, timestamp)
- Format notification message appropriately
- Handle both new feedback creation and updates

### Error Handling & Monitoring

- Log function execution and errors
- Implement retry mechanism for Signal API failures
- Set up Firebase monitoring and alerts
- Handle edge cases (empty feedback, API timeouts)

## Implementation Plan

### Phase 1: Firebase Functions Setup

1. Install Firebase CLI globally
2. Initialize Firebase Functions in project
3. Configure `firebase.json` and `.firebaserc`
4. Set up local development environment
5. Test basic function deployment

### Phase 2: Database Trigger Implementation

1. Create function that triggers on `/server/feedback/{feedbackId}` writes
2. Extract and validate feedback data
3. Format notification message with user info and feedback content
4. Test with local Firebase emulator

### Phase 3: Signal CLI Integration

1. Set up Signal CLI REST API server
2. Configure Signal number and recipient phone number
3. Implement HTTP client for Signal API calls
4. Add retry logic and error handling
5. Test Signal message sending

### Phase 4: Deployment & Testing

1. Deploy Cloud Function to Firebase
2. Test with real feedback submissions
3. Monitor function logs and performance
4. Optimize and fine-tune as needed

## Dependencies

### Firebase

- `firebase-functions` - Cloud Functions SDK
- `firebase-admin` - Admin SDK for database access
- `firebase-tools` - CLI tools

### Signal Integration

- `axios` - HTTP client for Signal API
- Signal CLI REST API server setup

### Development

- Node.js 18+ runtime
- Firebase CLI
- Local Firebase emulator for testing

## Configuration Required

### Firebase Project

- Enable Cloud Functions in Firebase Console
- Configure billing (required for Cloud Functions)
- Set up proper IAM permissions

### Signal CLI

- Install Signal CLI on server/container
- Register Signal number
- Configure REST API server
- Set up recipient phone number

### Environment Variables

- `SIGNAL_API_URL` - Signal CLI REST API endpoint
- `SIGNAL_RECIPIENT` - Developer's phone number
- `SIGNAL_SENDER` - Signal CLI registered number

## Expected Message Format

```
🚨 New Feedback Received

User: {uid}
Date: {date}
Platform: {userAgent}
Version: {version}

Feedback:
{feedbackString}

---
TravelCost App
```

## User Notes

- This is the first Cloud Functions implementation in this project
- Need complete setup from scratch including Firebase CLI installation
- Signal CLI REST API needs to be running on a server/container
- Consider using a VPS or cloud instance for Signal CLI if needed
- Ensure proper error handling since this affects user experience
- Test thoroughly with real feedback submissions before going live

## Work Log

- [2025-01-27] Created task, analyzed existing feedback system
