const axios = require("axios");

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

// Icon name mapping for Ionicons v6+
const ICON_NAME_MAPPING = {
  // Remove ios- prefixes
  "ios-trash-outline": "trash-outline",
  "ios-checkmark-circle": "checkmark-circle",
  "ios-git-compare-outline": "git-compare-outline",
  "ios-earth": "globe-outline",
  "ios-arrow-undo-outline": "arrow-undo-outline",

  // Remove md- prefixes
  "md-arrow-undo-outline": "arrow-undo-outline",
  "md-git-compare-outline": "git-compare-outline",
};

// You'll need to get a valid auth token - replace this with your actual token
const AUTH_TOKEN = "YOUR_FIREBASE_AUTH_TOKEN_HERE";

class IconNameDBMigration {
  constructor(options = {}) {
    this.stats = {
      totalTrips: 0,
      totalUsers: 0,
      totalCategories: 0,
      updatedCategories: 0,
      skippedCategories: 0,
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
    console.log("🚀 Starting Database Icon Name Migration...");
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

      // Process categories in the trip data
      if (tripData.categories) {
        await this.processTripCategories(tripId, tripData.categories);
      }

      // Process each user's categories in the trip
      for (const [uid, userData] of Object.entries(tripData)) {
        if (userData && userData.categories) {
          await this.processUserCategories(tripId, uid, userData.categories);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to process trip ${tripId}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      this.stats.errors.push(errorMsg);
    }
  }

  async processTripCategories(tripId, categories) {
    console.log(`  📁 Processing trip categories`);
    let categoryList;

    try {
      // Categories might be stored as a stringified array
      categoryList =
        typeof categories === "string" ? JSON.parse(categories) : categories;
    } catch (error) {
      console.log(`    ⚠️  Invalid category data format`);
      return;
    }

    if (!Array.isArray(categoryList)) {
      console.log(`    ⚠️  Categories is not an array`);
      return;
    }

    this.stats.totalCategories += categoryList.length;
    let updatedCategories = false;

    // Process each category
    for (const category of categoryList) {
      if (category.icon && ICON_NAME_MAPPING.hasOwnProperty(category.icon)) {
        const oldIcon = category.icon;
        const newIcon = ICON_NAME_MAPPING[oldIcon];

        if (this.options.dryRun) {
          console.log(
            `    🔍 [DRY RUN] Would update category icon from ${oldIcon} to ${newIcon}`
          );
          this.stats.updatedCategories++;
          updatedCategories = true;
        } else {
          category.icon = newIcon;
          this.stats.updatedCategories++;
          updatedCategories = true;
          console.log(
            `    ✅ Updated category icon from ${oldIcon} to ${newIcon}`
          );
        }
      } else {
        this.stats.skippedCategories++;
      }
    }

    // Update the trip's categories if changes were made
    if (updatedCategories && !this.options.dryRun) {
      const updatedCategoriesString = JSON.stringify(categoryList);
      await axios.patch(
        `${BACKEND_URL}/trips/${tripId}.json?auth=${AUTH_TOKEN}`,
        { categories: updatedCategoriesString },
        { timeout: 10000 }
      );
      console.log(`    💾 Saved updated categories to trip`);
    }
  }

  async processUserCategories(tripId, uid, categories) {
    console.log(`  👤 Processing user categories for: ${uid}`);
    this.stats.totalUsers++;

    let categoryList;
    try {
      categoryList =
        typeof categories === "string" ? JSON.parse(categories) : categories;
    } catch (error) {
      console.log(`    ⚠️  Invalid category data format`);
      return;
    }

    if (!Array.isArray(categoryList)) {
      console.log(`    ⚠️  Categories is not an array`);
      return;
    }

    this.stats.totalCategories += categoryList.length;
    let updatedCategories = false;

    // Process categories in batches
    const batches = this.chunkArray(categoryList, this.options.batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(
        `    📦 Processing batch ${i + 1}/${batches.length} (${batch.length} categories)`
      );

      for (const category of batch) {
        if (category.icon && ICON_NAME_MAPPING.hasOwnProperty(category.icon)) {
          const oldIcon = category.icon;
          const newIcon = ICON_NAME_MAPPING[oldIcon];

          if (this.options.dryRun) {
            console.log(
              `    🔍 [DRY RUN] Would update category icon from ${oldIcon} to ${newIcon}`
            );
            this.stats.updatedCategories++;
            updatedCategories = true;
          } else {
            category.icon = newIcon;
            this.stats.updatedCategories++;
            updatedCategories = true;
            console.log(
              `    ✅ Updated category icon from ${oldIcon} to ${newIcon}`
            );
          }
        } else {
          this.stats.skippedCategories++;
        }
      }

      // Add delay between batches
      if (i < batches.length - 1) {
        await this.delay(this.options.delayMs);
      }
    }

    // Update the user's categories if changes were made
    if (updatedCategories && !this.options.dryRun) {
      const updatedCategoriesString = JSON.stringify(categoryList);
      await axios.patch(
        `${BACKEND_URL}/trips/${tripId}/${uid}.json?auth=${AUTH_TOKEN}`,
        { categories: updatedCategoriesString },
        { timeout: 10000 }
      );
      console.log(`    💾 Saved updated categories to user`);
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
    console.log(`📝 Total Categories Found: ${this.stats.totalCategories}`);
    console.log(`✅ Categories Updated: ${this.stats.updatedCategories}`);
    console.log(`⏭️  Categories Skipped: ${this.stats.skippedCategories}`);
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
🚀 Database Icon Name Migration Script

USAGE:
  node scripts/migrate-db-icon-names.js [OPTIONS]

OPTIONS:
  -t, --trip-id <id>     Run migration on specific trip ID only
  -d, --dry-run          Preview changes without making them
  -b, --batch-size <n>   Number of categories to process in parallel (default: 10)
  --delay <ms>           Delay between batches in milliseconds (default: 100)
  -h, --help            Show this help message

EXAMPLES:
  # Run on all trips (dry run)
  node scripts/migrate-db-icon-names.js --dry-run

  # Run on specific trip
  node scripts/migrate-db-icon-names.js --trip-id "trip123"

  # Run with custom batch size and delay
  node scripts/migrate-db-icon-names.js --batch-size 5 --delay 200

NOTES:
  - Make sure to set AUTH_TOKEN in the script before running
  - Consider running with --dry-run first to preview changes
  - The script processes categories in batches to avoid rate limiting
  - Both trip-level and user-level categories are updated
`);
}

// Run the migration
async function main() {
  const options = parseArgs();
  const migration = new IconNameDBMigration(options);
  await migration.run();
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the script
main().catch(console.error);
