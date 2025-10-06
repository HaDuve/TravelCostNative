"use strict";
const __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        let desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get() {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
const __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
const __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    const result = {};
    if (mod != null)
      for (const k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
const __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
let _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.onFeedbackCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
// Initialize Firebase Admin SDK
admin.initializeApp();
// Discord webhook configuration
const DISCORD_WEBHOOK_URL =
  ((_a = functions.config().discord) === null || _a === void 0
    ? void 0
    : _a.webhook_url) || process.env.DISCORD_WEBHOOK_URL;
/**
 * Cloud Function that triggers when new feedback is created
 * Sends a Discord notification to the developer
 */
exports.onFeedbackCreated = functions.database
  .ref("/server/feedback/{feedbackId}")
  .onCreate(async (snapshot, context) => {
    const feedbackId = context.params.feedbackId;
    const feedbackData = snapshot.val();
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
function formatDiscordMessage(feedback) {
  const user = feedback.uid || "anonymous";
  const date = new Date(feedback.date).toLocaleString();
  const platform = feedback.userAgent || "unknown";
  const version = feedback.version || "unknown";
  return {
    content: "🚨 **New Feedback Received**",
    embeds: [
      {
        title: "TravelCost App Feedback",
        color: 0x00ff00,
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
                ? `${feedback.feedbackString.substring(0, 1000)}...`
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
async function sendDiscordNotification(message) {
  if (!DISCORD_WEBHOOK_URL) {
    throw new Error(
      "Discord webhook URL not configured. Please set DISCORD_WEBHOOK_URL"
    );
  }
  const response = await axios_1.default.post(DISCORD_WEBHOOK_URL, message, {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });
  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `Discord webhook returned status ${response.status}: ${JSON.stringify(response.data)}`
    );
  }
}
//# sourceMappingURL=index.js.map
