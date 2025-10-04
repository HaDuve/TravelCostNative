import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Discord webhook configuration
const DISCORD_WEBHOOK_URL =
  functions.config().discord?.webhook_url || process.env.DISCORD_WEBHOOK_URL;

interface FeedbackData {
  uid: string;
  feedbackString: string;
  date: string;
  timestamp: number;
  userAgent?: string;
  version?: string;
}

/**
 * Cloud Function that triggers when new feedback is created
 * Sends a Discord notification to the developer
 */
export const onFeedbackCreated = functions.database
  .ref("/server/feedback/{feedbackId}")
  .onCreate(async (snapshot, context) => {
    const feedbackId = context.params.feedbackId;
    const feedbackData = snapshot.val() as FeedbackData;

    functions.logger.info(`New feedback received: ${feedbackId}`, {
      feedbackId,
      uid: feedbackData.uid,
      timestamp: feedbackData.timestamp,
    });

    // Validate feedback data
    if (!feedbackData || !feedbackData.feedbackString) {
      functions.logger.error("Invalid feedback data received", { feedbackId });
      return null;
    }

    // Format the notification message
    const message = formatDiscordMessage(feedbackData);

    try {
      // Send Discord notification
      await sendDiscordNotification(message);

      functions.logger.info("Discord notification sent successfully", {
        feedbackId,
      });
    } catch (error) {
      functions.logger.error("Failed to send Discord notification", {
        feedbackId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Don't throw error to avoid function retry
      // The feedback is still stored successfully
    }

    return null;
  });

/**
 * Formats the feedback data into a Discord message with rich formatting
 */
function formatDiscordMessage(feedback: FeedbackData): any {
  const user = feedback.uid || "anonymous";
  const date = new Date(feedback.date).toLocaleString();
  const platform = feedback.userAgent || "unknown";
  const version = feedback.version || "unknown";

  return {
    content: "🚨 **New Feedback Received**",
    embeds: [
      {
        title: "TravelCost App Feedback",
        color: 0x00ff00, // Green color
        fields: [
          {
            name: "👤 User",
            value: user,
            inline: true,
          },
          {
            name: "📅 Date",
            value: date,
            inline: true,
          },
          {
            name: "📱 Platform",
            value: platform,
            inline: true,
          },
          {
            name: "🔢 Version",
            value: version,
            inline: true,
          },
          {
            name: "💬 Feedback",
            value:
              feedback.feedbackString.length > 1000
                ? feedback.feedbackString.substring(0, 1000) + "..."
                : feedback.feedbackString,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: "TravelCost App • Feedback System",
        },
      },
    ],
  };
}

/**
 * Sends a Discord notification using webhook
 */
async function sendDiscordNotification(message: any): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    throw new Error(
      "Discord webhook URL not configured. Please set DISCORD_WEBHOOK_URL"
    );
  }

  const response = await axios.post(DISCORD_WEBHOOK_URL, message, {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `Discord webhook returned status ${response.status}: ${JSON.stringify(
        response.data
      )}`
    );
  }
}
