const axios = require("axios");

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

// You'll need to get a valid auth token - replace this with your actual token
const AUTH_TOKEN =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6IjA1NTc3MjZmYWIxMjMxZmEyZGNjNTcyMWExMDgzZGE2ODBjNGE3M2YiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdHJhdmVsY29zdG5hdGl2ZSIsImF1ZCI6InRyYXZlbGNvc3RuYXRpdmUiLCJhdXRoX3RpbWUiOjE3NTg4NjUyMDQsInVzZXJfaWQiOiJRb29GV0pURUdqVlBYTE1pMjdKZ3hLQ2R6VWoyIiwic3ViIjoiUW9vRldKVEVHalZQWExNaTI3Smd4S0NkelVqMiIsImlhdCI6MTc1ODg2NTIwNCwiZXhwIjoxNzU4ODY4ODA0LCJlbWFpbCI6ImhhQGhhLmRlIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImhhQGhhLmRlIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.JC4Bxt_XE99vMy9qAG5wurETpN6zh0IMXP-605tbqW9NTU_dH_eO20uKS26ul_ZzKpeOuOq0S_DdVV7hs5o3-pD_QJUF-SB63PzNIvaE14Ij5v0aOPTbGIxRsFX7qEiDkojsY5B1kBVWaxj5QmLq_7HI9Eg_LD4hPQ5wDZIsnkN_x7buWAKkHIbLqBChbdqTu6L2zl-qp4MI76pRPKJNcd1dMObpmi4GVNDbb3uQhgwyyQeTpH19_Uh4-PRqIgdHrz7BAih-4x16NbvFeENcSxcRlniCsZrAhirToiMjesIixcW0FB1prHBPBScWX2sEfRyccYfWzWNJtO4wFybn-g";

class ServerTimestampMigration {
  constructor(options = {}) {
    this.stats = {
      totalTrips: 0,
      totalUsers: 0,
      totalExpenses: 0,
      updatedExpenses: 0,
      skippedExpenses: 0,
      errors: [],
    };

    this.options = {
      dryRun: false,
      batchSize: 10,
      delayMs: 100,
      ...options,
    };
  }

  async run() {
    console.log("🚀 Starting Server Timestamp Migration...");
    console.log("=".repeat(50));

    if (this.options.dryRun) {
      console.log("🔍 DRY RUN MODE - No changes will be made");
    }

    if (this.options.tripId) {
      console.log(`🎯 Targeting specific trip: ${this.options.tripId}`);
    }

    try {
      if (!AUTH_TOKEN || AUTH_TOKEN === "YOUR_FIREBASE_AUTH_TOKEN_HERE") {
        throw new Error("Please set a valid AUTH_TOKEN in the script");
      }

      // Get trips to process
      const trips = this.options.tripId
        ? [this.options.tripId]
        : await this.getAllTrips();
      console.log(`📊 Found ${trips.length} trip(s) to process`);

      // Process each trip
      for (const tripId of trips) {
        await this.processTrip(tripId);
      }

      // Print final statistics
      this.printStats();
    } catch (error) {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    }
  }

  async getAllTrips() {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/trips.json?auth=${AUTH_TOKEN}`,
        { timeout: 30000 }
      );

      const trips = response.data;
      if (!trips) return [];

      return Object.keys(trips);
    } catch (error) {
      console.error("Failed to fetch trips:", error);
      throw error;
    }
  }

  async processTrip(tripId) {
    console.log(`\n🏷️  Processing trip: ${tripId}`);

    try {
      // Verify trip exists
      const response = await axios.get(
        `${BACKEND_URL}/trips/${tripId}.json?auth=${AUTH_TOKEN}`,
        { timeout: 30000 }
      );

      const tripData = response.data;
      if (!tripData) {
        console.log(`⚠️  Trip ${tripId} not found or empty`);
        return;
      }

      this.stats.totalTrips++;

      // Process each user in the trip
      for (const [uid, userData] of Object.entries(tripData)) {
        if (userData && userData.expenses) {
          await this.processUserExpenses(tripId, uid, userData.expenses);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to process trip ${tripId}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      this.stats.errors.push(errorMsg);
    }
  }

  async processUserExpenses(tripId, uid, expenses) {
    console.log(`  👤 Processing user: ${uid}`);

    this.stats.totalUsers++;
    const expenseIds = Object.keys(expenses);
    this.stats.totalExpenses += expenseIds.length;

    console.log(`    📝 Found ${expenseIds.length} expenses`);

    // Process expenses in batches
    const batches = this.chunkArray(expenseIds, this.options.batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(
        `    📦 Processing batch ${i + 1}/${batches.length} (${
          batch.length
        } expenses)`
      );

      await this.processBatch(tripId, uid, batch, expenses);

      // Add delay between batches
      if (i < batches.length - 1) {
        await this.delay(this.options.delayMs);
      }
    }
  }

  async processBatch(tripId, uid, expenseIds, allExpenses) {
    const promises = expenseIds.map(async (expenseId) => {
      try {
        const expense = allExpenses[expenseId];

        // Check if serverTimestamp is missing or null/undefined
        if (
          expense.serverTimestamp === undefined ||
          expense.serverTimestamp === null
        ) {
          if (this.options.dryRun) {
            console.log(`    🔍 [DRY RUN] Would update expense ${expenseId}`);
            this.stats.updatedExpenses++;
          } else {
            await this.updateExpense(tripId, uid, expenseId, expense);
            console.log(`    ✅ Updated expense ${expenseId}`);
            this.stats.updatedExpenses++;
          }
        } else {
          this.stats.skippedExpenses++;
          console.log(
            `    ⏭️  Skipped expense ${expenseId} (already has serverTimestamp: ${expense.serverTimestamp})`
          );
        }
      } catch (error) {
        const errorMsg = `Failed to update expense ${expenseId} in trip ${tripId}, user ${uid}: ${error.message}`;
        console.error(`    ❌ ${errorMsg}`);
        this.stats.errors.push(errorMsg);
      }
    });

    await Promise.all(promises);
  }

  async updateExpense(tripId, uid, expenseId, expense) {
    try {
      // Update only the serverTimestamp field
      await axios.patch(
        `${BACKEND_URL}/trips/${tripId}/${uid}/expenses/${expenseId}.json?auth=${AUTH_TOKEN}`,
        { serverTimestamp: 0 },
        { timeout: 10000 }
      );
    } catch (error) {
      throw new Error(`Update failed: ${error.message}`);
    }
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  printStats() {
    console.log("\n" + "=".repeat(50));
    console.log("📊 MIGRATION COMPLETE - FINAL STATISTICS");
    console.log("=".repeat(50));
    console.log(`🏷️  Total Trips Processed: ${this.stats.totalTrips}`);
    console.log(`👤 Total Users Processed: ${this.stats.totalUsers}`);
    console.log(`📝 Total Expenses Found: ${this.stats.totalExpenses}`);
    console.log(`✅ Expenses Updated: ${this.stats.updatedExpenses}`);
    console.log(`⏭️  Expenses Skipped: ${this.stats.skippedExpenses}`);
    console.log(`❌ Errors: ${this.stats.errors.length}`);

    if (this.stats.errors.length > 0) {
      console.log("\n🚨 ERRORS ENCOUNTERED:");
      this.stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (this.options.dryRun) {
      console.log("\n🔍 This was a DRY RUN - no actual changes were made");
    } else {
      console.log("\n🎉 Migration completed successfully!");
    }
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--trip-id":
      case "-t":
        options.tripId = args[i + 1];
        i++; // Skip next argument as it's the value
        break;
      case "--dry-run":
      case "-d":
        options.dryRun = true;
        break;
      case "--batch-size":
      case "-b":
        options.batchSize = parseInt(args[i + 1], 10);
        i++; // Skip next argument as it's the value
        break;
      case "--delay":
        options.delayMs = parseInt(args[i + 1], 10);
        i++; // Skip next argument as it's the value
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
🚀 Server Timestamp Migration Script

USAGE:
  node scripts/migrate-server-timestamps.js [OPTIONS]

OPTIONS:
  -t, --trip-id <id>     Run migration on specific trip ID only
  -d, --dry-run          Preview changes without making them
  -b, --batch-size <n>   Number of expenses to process in parallel (default: 10)
  --delay <ms>           Delay between batches in milliseconds (default: 100)
  -h, --help             Show this help message

EXAMPLES:
  # Run on all trips
  node scripts/migrate-server-timestamps.js

  # Run on specific trip
  node scripts/migrate-server-timestamps.js --trip-id "trip123"

  # Dry run on specific trip
  node scripts/migrate-server-timestamps.js --trip-id "trip123" --dry-run

  # Run with custom batch size and delay
  node scripts/migrate-server-timestamps.js --batch-size 5 --delay 200

NOTES:
  - Make sure to set AUTH_TOKEN in the script before running
  - Consider running with --dry-run first to preview changes
  - The script processes expenses in batches to avoid rate limiting
`);
}

// Run the migration
async function main() {
  const options = parseArgs();
  const migration = new ServerTimestampMigration(options);
  await migration.run();
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the script
main().catch(console.error);
