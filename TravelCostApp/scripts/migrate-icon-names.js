const axios = require("axios");
const fs = require("fs");
const path = require("path");

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

  // Keep these unchanged (for reference)
  "document-outline": "document-outline",
  "pie-chart-outline": "pie-chart-outline",
  "close-outline": "close-outline",
  "checkmark-done-outline": "checkmark-done-outline",
  "ellipsis-horizontal-circle-outline": "ellipsis-horizontal-circle-outline",
};

class IconNameMigration {
  constructor(options = {}) {
    this.stats = {
      totalFiles: 0,
      updatedFiles: 0,
      skippedFiles: 0,
      totalReplacements: 0,
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
    console.log("🚀 Starting Icon Name Migration...");
    console.log("=".repeat(50));

    if (this.options.dryRun) {
      console.log("🔍 DRY RUN MODE - No changes will be made");
    }

    if (this.options.targetFile) {
      console.log(`🎯 Targeting specific file: ${this.options.targetFile}`);
    }

    try {
      // Get files to process
      const files = this.options.targetFile
        ? [this.options.targetFile]
        : await this.findFilesToProcess();

      console.log(`📊 Found ${files.length} file(s) to process`);

      // Process each file
      for (const file of files) {
        await this.processFile(file);
      }

      // Print final statistics
      this.printStats();
    } catch (error) {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    }
  }

  async findFilesToProcess() {
    const files = [];
    const searchDirs = ["components", "screens"];

    for (const dir of searchDirs) {
      await this.walkDir(dir, files);
    }

    return files.filter(
      (file) => file.endsWith(".tsx") || file.endsWith(".ts")
    );
  }

  async walkDir(dir, files) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.walkDir(fullPath, files);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  async processFile(filePath) {
    console.log(`\n📝 Processing file: ${filePath}`);
    this.stats.totalFiles++;

    try {
      const content = fs.readFileSync(filePath, "utf8");
      let updatedContent = content;
      let madeChanges = false;

      // Search for icon name patterns
      for (const [oldName, newName] of Object.entries(ICON_NAME_MAPPING)) {
        const regex = new RegExp(`icon=["']{1}${oldName}["']{1}`, "g");
        const stringRegex = new RegExp(`["']{1}${oldName}["']{1}`, "g");

        // Check for icon prop usage
        const iconMatches = content.match(regex) || [];
        // Check for string literal usage
        const stringMatches = content.match(stringRegex) || [];

        const totalMatches = iconMatches.length + stringMatches.length;

        if (totalMatches > 0) {
          if (this.options.dryRun) {
            console.log(
              `    🔍 [DRY RUN] Would replace ${totalMatches} occurrences of ${oldName} with ${newName}`
            );
            madeChanges = true;
            this.stats.totalReplacements += totalMatches;
          } else {
            // Replace icon prop usage
            updatedContent = updatedContent.replace(regex, `icon="${newName}"`);
            // Replace string literal usage
            updatedContent = updatedContent.replace(
              stringRegex,
              `"${newName}"`
            );

            console.log(
              `    ✅ Replaced ${totalMatches} occurrences of ${oldName} with ${newName}`
            );
            madeChanges = true;
            this.stats.totalReplacements += totalMatches;
          }
        }
      }

      if (madeChanges) {
        if (!this.options.dryRun) {
          fs.writeFileSync(filePath, updatedContent);
        }
        this.stats.updatedFiles++;
        console.log(`    ✨ File updated successfully`);
      } else {
        this.stats.skippedFiles++;
        console.log(`    ⏭️  No icon names to update in this file`);
      }
    } catch (error) {
      const errorMsg = `Failed to process file ${filePath}: ${error.message}`;
      console.error(`    ❌ ${errorMsg}`);
      this.stats.errors.push(errorMsg);
    }
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  printStats() {
    console.log("\n" + "=".repeat(50));
    console.log("📊 MIGRATION COMPLETE - FINAL STATISTICS");
    console.log("=".repeat(50));
    console.log(`📝 Total Files Processed: ${this.stats.totalFiles}`);
    console.log(`✅ Files Updated: ${this.stats.updatedFiles}`);
    console.log(`⏭️  Files Skipped: ${this.stats.skippedFiles}`);
    console.log(`🔄 Total Replacements: ${this.stats.totalReplacements}`);
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
      case "--file":
      case "-f":
        options.targetFile = args[i + 1];
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
🚀 Icon Name Migration Script

USAGE:
  node scripts/migrate-icon-names.js [OPTIONS]

OPTIONS:
  -f, --file <path>     Run migration on specific file only
  -d, --dry-run         Preview changes without making them
  -b, --batch-size <n>  Number of files to process in parallel (default: 10)
  --delay <ms>          Delay between batches in milliseconds (default: 100)
  -h, --help            Show this help message

EXAMPLES:
  # Run on all files
  node scripts/migrate-icon-names.js

  # Run on specific file
  node scripts/migrate-icon-names.js --file "components/ExpensesList.tsx"

  # Dry run on all files
  node scripts/migrate-icon-names.js --dry-run

  # Run with custom batch size and delay
  node scripts/migrate-icon-names.js --batch-size 5 --delay 200

NOTES:
  - The script updates icon names to match Ionicons v6+ naming convention
  - Consider running with --dry-run first to preview changes
  - The script processes files in batches to avoid overwhelming the system
`);
}

// Run the migration
async function main() {
  const options = parseArgs();
  const migration = new IconNameMigration(options);
  await migration.run();
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the script
main().catch(console.error);
