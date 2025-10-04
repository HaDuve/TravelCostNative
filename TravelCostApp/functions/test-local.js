/**
 * Local test script for the feedback notification function
 * Run with: node test-local.js
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json"); // You'll need to download this
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.database();

// Test data
const testFeedback = {
  uid: "test-user-123",
  feedbackString: "This is a test feedback message from the local test script.",
  date: new Date().toISOString(),
  timestamp: Date.now(),
  userAgent: "Test Script",
  version: "1.0.0",
};

async function testFeedbackCreation() {
  try {
    console.log("Creating test feedback...");

    // Create a test feedback entry
    const feedbackRef = db.ref("/server/feedback").push();
    await feedbackRef.set(testFeedback);

    console.log("✅ Test feedback created successfully!");
    console.log("Feedback ID:", feedbackRef.key);
    console.log("Feedback data:", testFeedback);

    // Clean up - remove the test feedback
    setTimeout(async () => {
      await feedbackRef.remove();
      console.log("🧹 Test feedback cleaned up");
      process.exit(0);
    }, 5000);
  } catch (error) {
    console.error("❌ Error creating test feedback:", error);
    process.exit(1);
  }
}

// Run the test
testFeedbackCreation();
