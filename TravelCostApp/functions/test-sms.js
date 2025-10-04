/**
 * Test script for SMS integration
 * Run with: node test-sms.js
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL:
    "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.database();

// Test data
const testFeedback = {
  uid: "test-user-123",
  feedbackString:
    "This is a test feedback message for SMS integration. Please check if you received the SMS notification!",
  date: new Date().toISOString(),
  timestamp: Date.now(),
  userAgent: "Test Script",
  version: "1.0.0",
};

async function testSMS() {
  try {
    console.log("🧪 Testing SMS integration...");
    console.log("Creating test feedback entry...");

    // Create a test feedback entry
    const feedbackRef = db.ref("/server/feedback").push();
    await feedbackRef.set(testFeedback);

    console.log("✅ Test feedback created successfully!");
    console.log("📱 Feedback ID:", feedbackRef.key);
    console.log("📱 Feedback data:", testFeedback);
    console.log("");
    console.log("⏳ Waiting for SMS notification...");
    console.log("Check your phone for the SMS message!");
    console.log("");
    console.log("📊 To check function logs, run:");
    console.log("   firebase functions:log --only onFeedbackCreated");
    console.log("");

    // Clean up after 15 seconds
    setTimeout(async () => {
      try {
        await feedbackRef.remove();
        console.log("🧹 Test feedback cleaned up");
        console.log("✅ Test completed!");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error cleaning up:", error);
        process.exit(1);
      }
    }, 15000);
  } catch (error) {
    console.error("❌ Error creating test feedback:", error);
    process.exit(1);
  }
}

// Run the test
testSMS();
