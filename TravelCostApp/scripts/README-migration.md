# Server Timestamp Migration Scripts

This directory contains migration scripts to add `serverTimestamp: 0` to all expenses in your Firebase Realtime Database that don't already have this field.

## Problem

Your delta sync functionality uses Firebase queries like:

```
orderBy="editedTimestamp"&startAt=${lastFetch}
```

However, Firebase automatically excludes entries where the `orderBy` field is `null` or `undefined`. This means:

- New expenses without `editedTimestamp` are missing from delta sync
- Expenses with `null`/`undefined` `serverTimestamp` are excluded from queries

## Solution

These migration scripts add `serverTimestamp: 0` to all expenses that don't already have this field, ensuring they can be included in Firebase queries.

## Scripts Available

### 1. TypeScript Version (Recommended)

- **File**: `migrate-server-timestamps.ts`
- **Command**: `npm run migrate:timestamps`
- **Features**: Uses your existing Firebase auth system

### 2. JavaScript Version (Standalone)

- **File**: `migrate-server-timestamps.js`
- **Command**: `npm run migrate:timestamps:js`
- **Features**: Requires manual auth token setup

## Usage

### Prerequisites

1. **For TypeScript version**: Ensure you have `ts-node` installed:

   ```bash
   npm install -g ts-node
   ```

2. **For JavaScript version**: Update the `AUTH_TOKEN` in the script:
   ```javascript
   const AUTH_TOKEN = "your_actual_firebase_auth_token_here";
   ```

### Basic Usage

```bash
# Run on all trips (TypeScript)
npm run migrate:timestamps

# Run on all trips (JavaScript)
npm run migrate:timestamps:js

# Run on specific trip
npm run migrate:timestamps -- --trip-id "your-trip-id"

# Dry run (preview changes without making them)
npm run migrate:timestamps -- --dry-run

# Run on specific trip with dry run
npm run migrate:timestamps -- --trip-id "your-trip-id" --dry-run
```

### Advanced Options

```bash
# Custom batch size (default: 10)
npm run migrate:timestamps -- --batch-size 5

# Custom delay between batches (default: 100ms)
npm run migrate:timestamps -- --delay 200

# Combine options
npm run migrate:timestamps -- --trip-id "trip123" --dry-run --batch-size 5 --delay 200
```

### Command Line Options

| Option             | Short | Description                               | Default   |
| ------------------ | ----- | ----------------------------------------- | --------- |
| `--trip-id <id>`   | `-t`  | Run migration on specific trip ID only    | All trips |
| `--dry-run`        | `-d`  | Preview changes without making them       | false     |
| `--batch-size <n>` | `-b`  | Number of expenses to process in parallel | 10        |
| `--delay <ms>`     |       | Delay between batches in milliseconds     | 100       |
| `--help`           | `-h`  | Show help message                         | -         |

## Safety Features

### 1. Dry Run Mode

Always test with `--dry-run` first to preview what will be changed:

```bash
npm run migrate:timestamps -- --dry-run
```

### 2. Batch Processing

- Processes expenses in small batches to avoid overwhelming Firebase
- Configurable batch size and delays
- Continues processing even if individual updates fail

### 3. Selective Updates

- Only updates expenses that don't already have `serverTimestamp`
- Skips expenses that already have the field
- Uses PATCH requests to only update the specific field

### 4. Error Handling

- Continues processing even if individual updates fail
- Logs all errors for review
- Provides detailed statistics at the end

## Example Output

```
🚀 Starting Server Timestamp Migration...
==================================================
🔍 DRY RUN MODE - No changes will be made
🎯 Targeting specific trip: trip123
📊 Found 1 trip(s) to process

🏷️  Processing trip: trip123
  👤 Processing user: user456
    📝 Found 25 expenses
    📦 Processing batch 1/3 (10 expenses)
    🔍 [DRY RUN] Would update expense -abc123
    ⏭️  Skipped expense -def456 (already has serverTimestamp: 1640995200000)
    🔍 [DRY RUN] Would update expense -ghi789
    ...

==================================================
📊 MIGRATION COMPLETE - FINAL STATISTICS
==================================================
🏷️  Total Trips Processed: 1
👤 Total Users Processed: 1
📝 Total Expenses Found: 25
✅ Expenses Updated: 15
⏭️  Expenses Skipped: 10
❌ Errors: 0

🔍 This was a DRY RUN - no actual changes were made
```

## Getting Firebase Auth Token

### For TypeScript Version

The script uses your existing `getValidIdToken()` function, so no additional setup is needed.

### For JavaScript Version

You need to get a Firebase auth token. Here are a few ways:

1. **From your app's debug logs** when it makes API calls
2. **Using Firebase Admin SDK** to generate a token
3. **From Firebase Console** → Authentication → Users → Select user → Copy ID token

## Troubleshooting

### Common Issues

1. **"Failed to get authentication token"**

   - For TypeScript: Check your Firebase auth setup
   - For JavaScript: Update the `AUTH_TOKEN` constant

2. **"Trip not found"**

   - Verify the trip ID exists in your database
   - Check your Firebase URL configuration

3. **Rate limiting errors**

   - Increase the `--delay` parameter
   - Decrease the `--batch-size` parameter

4. **Timeout errors**
   - The script has 30-second timeouts for most operations
   - For very large databases, consider processing specific trips

### Performance Tips

- **Start with a small trip** to test the migration
- **Use dry-run mode** to estimate the scope
- **Run during low-traffic periods** to avoid conflicts
- **Monitor Firebase usage** during the migration

## After Migration

Once the migration is complete:

1. **Test your delta sync** to ensure it works correctly
2. **Monitor your app** for any sync-related issues
3. **Consider updating your expense creation code** to always set `editedTimestamp` for new expenses

## Rollback

If you need to rollback the changes:

1. The migration only adds `serverTimestamp: 0` to expenses
2. You can remove this field if needed using a similar script
3. The original expense data is not modified, only the `serverTimestamp` field is added

## Support

If you encounter issues:

1. Check the error messages in the console output
2. Verify your Firebase configuration
3. Test with a small trip first using `--dry-run`
4. Check Firebase console for any quota or permission issues
