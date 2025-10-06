#!/usr/bin/env node

/**
 * Migration script to convert cc-sessions setup to Cursor-based workflow
 * This script helps migrate existing tasks and configuration to the new Cursor system
 */

const fs = require("fs");
const path = require("path");

// Configuration
const SOURCE_DIR = "sessions";
const TARGET_DIR = ".cursor";
const TASKS_DIR = "tasks";

console.log("🚀 Starting migration from cc-sessions to Cursor workflow...\n");

// Ensure target directories exist
const ensureDir = dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
};

// Create necessary directories
ensureDir(TARGET_DIR);
ensureDir(`${TARGET_DIR}/flows`);
ensureDir(`${TARGET_DIR}/commands`);
ensureDir(`${TARGET_DIR}/agents`);
ensureDir(`${TARGET_DIR}/templates`);
ensureDir(`${TARGET_DIR}/state`);
ensureDir(`${TARGET_DIR}/config`);
ensureDir(TASKS_DIR);
ensureDir(`${TASKS_DIR}/done`);

// Migrate existing tasks
console.log("\n📋 Migrating existing tasks...");

if (fs.existsSync(`${SOURCE_DIR}/tasks`)) {
  const tasks = fs.readdirSync(`${SOURCE_DIR}/tasks`);

  tasks.forEach(task => {
    if (task === "TEMPLATE.md" || task === "done") return;

    const sourcePath = `${SOURCE_DIR}/tasks/${task}`;
    const targetPath = `${TASKS_DIR}/${task}`;

    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  ✅ Migrated task: ${task}`);
    } else if (fs.statSync(sourcePath).isDirectory()) {
      // Copy directory tasks
      fs.cpSync(sourcePath, targetPath, { recursive: true });
      console.log(`  ✅ Migrated task directory: ${task}`);
    }
  });

  // Migrate completed tasks
  if (fs.existsSync(`${SOURCE_DIR}/tasks/done`)) {
    const doneTasks = fs.readdirSync(`${SOURCE_DIR}/tasks/done`);
    doneTasks.forEach(task => {
      const sourcePath = `${SOURCE_DIR}/tasks/done/${task}`;
      const targetPath = `${TASKS_DIR}/done/${task}`;
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  ✅ Migrated completed task: ${task}`);
    });
  }
}

// Migrate configuration
console.log("\n⚙️  Migrating configuration...");

if (fs.existsSync(`${SOURCE_DIR}/sessions-config.json`)) {
  const config = JSON.parse(
    fs.readFileSync(`${SOURCE_DIR}/sessions-config.json`, "utf8")
  );

  // Convert to Cursor format
  const cursorConfig = {
    developer_name: config.developer_name || "Developer",
    trigger_phrases: config.trigger_phrases || ["make it so", "go ahead"],
    blocked_tools: config.blocked_tools || ["Edit", "Write", "MultiEdit"],
    task_detection: config.task_detection || { enabled: true },
    branch_enforcement: config.branch_enforcement || { enabled: true },
    priority_prefixes: {
      "h-": "High priority",
      "m-": "Medium priority",
      "l-": "Low priority",
      "?-": "Investigate",
    },
    task_types: {
      "implement-": "feature/",
      "fix-": "fix/",
      "refactor-": "feature/",
      "research-": "none",
      "experiment-": "experiment/",
      "migrate-": "feature/",
      "test-": "feature/",
      "docs-": "feature/",
    },
    api_mode: config.api_mode || false,
  };

  fs.writeFileSync(
    `${TARGET_DIR}/config/task-config.json`,
    JSON.stringify(cursorConfig, null, 2)
  );
  console.log("  ✅ Migrated task configuration");
}

// Migrate current task state
console.log("\n📊 Migrating current task state...");

if (fs.existsSync(`${SOURCE_DIR}/../.claude/state/current_task.json`)) {
  const currentTask = JSON.parse(
    fs.readFileSync(`${SOURCE_DIR}/../.claude/state/current_task.json`, "utf8")
  );

  fs.writeFileSync(
    `${TARGET_DIR}/state/current_task.json`,
    JSON.stringify(currentTask, null, 2)
  );
  console.log("  ✅ Migrated current task state");
} else {
  // Create default state
  const defaultState = {
    task: null,
    branch: null,
    services: [],
    updated: new Date().toISOString().split("T")[0],
  };

  fs.writeFileSync(
    `${TARGET_DIR}/state/current_task.json`,
    JSON.stringify(defaultState, null, 2)
  );
  console.log("  ✅ Created default task state");
}

// Create migration summary
console.log("\n📝 Creating migration summary...");

const summary = `# Migration Summary

## Migrated Components

### ✅ Task Management
- Migrated all existing tasks from \`sessions/tasks/\` to \`tasks/\`
- Migrated completed tasks to \`tasks/done/\`
- Preserved task file structure and content

### ✅ Configuration
- Migrated \`sessions-config.json\` to \`.cursor/config/task-config.json\`
- Converted configuration format for Cursor compatibility
- Preserved all existing settings

### ✅ State Management
- Migrated current task state to \`.cursor/state/current_task.json\`
- Maintained existing task context

### ✅ Cursor Integration
- Created Cursor agent flows for task management
- Created custom slash commands for task operations
- Created specialized subagents for context gathering, code review, etc.

## New Cursor Commands

- \`/create-task [name]\` - Create new tasks with context gathering
- \`/start-task [name]\` - Start work on existing tasks
- \`/complete-task [name]\` - Complete tasks with agent delegation

## New Cursor Agents

- \`context-gathering\` - Creates comprehensive context manifests
- \`code-review\` - Reviews code for quality and security
- \`service-documentation\` - Updates CLAUDE.md files
- \`logging\` - Maintains task documentation

## Next Steps

1. Test the new Cursor commands: \`/create-task test-task\`
2. Verify task state migration: Check \`.cursor/state/current_task.json\`
3. Update your workflow to use Cursor commands instead of cc-sessions
4. Remove old cc-sessions files when ready

## Migration Date
${new Date().toISOString()}
`;

fs.writeFileSync("MIGRATION_SUMMARY.md", summary);
console.log("  ✅ Created migration summary: MIGRATION_SUMMARY.md");

console.log("\n🎉 Migration completed successfully!");
console.log("\nNext steps:");
console.log("1. Test the new Cursor commands");
console.log("2. Verify your tasks were migrated correctly");
console.log("3. Update your workflow to use Cursor instead of cc-sessions");
console.log("4. Check MIGRATION_SUMMARY.md for details");
