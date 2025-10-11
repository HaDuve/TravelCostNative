#!/bin/bash
# Migration script to transition from .claude/ to .cursor/ system

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "🔄 Migrating from .claude/ to .cursor/ system..."

# Check if .claude directory exists
if [ ! -d "$PROJECT_ROOT/.claude" ]; then
    echo "❌ No .claude directory found. Nothing to migrate."
    exit 0
fi

# Backup existing .claude directory
echo "📦 Creating backup of .claude directory..."
cp -r "$PROJECT_ROOT/.claude" "$PROJECT_ROOT/.claude.backup.$(date +%Y%m%d_%H%M%S)"

# Migrate state files
echo "📁 Migrating state files..."
if [ -d "$PROJECT_ROOT/.claude/state" ]; then
    mkdir -p "$PROJECT_ROOT/.cursor/state"
    cp -r "$PROJECT_ROOT/.claude/state"/* "$PROJECT_ROOT/.cursor/state/" 2>/dev/null || true
fi

# Migrate tasks from sessions/tasks to tasks/
echo "📋 Migrating tasks..."
if [ -d "$PROJECT_ROOT/sessions/tasks" ]; then
    mkdir -p "$PROJECT_ROOT/tasks"
    cp -r "$PROJECT_ROOT/sessions/tasks"/* "$PROJECT_ROOT/tasks/" 2>/dev/null || true
fi

# Migrate completed tasks
if [ -d "$PROJECT_ROOT/sessions/tasks/done" ]; then
    mkdir -p "$PROJECT_ROOT/tasks/done"
    cp -r "$PROJECT_ROOT/sessions/tasks/done"/* "$PROJECT_ROOT/tasks/done/" 2>/dev/null || true
fi

# Update task state file paths
echo "🔧 Updating task state references..."
if [ -f "$PROJECT_ROOT/.cursor/state/current_task.json" ]; then
    # Update any references to old paths
    sed -i.bak 's|sessions/tasks|tasks|g' "$PROJECT_ROOT/.cursor/state/current_task.json"
    rm -f "$PROJECT_ROOT/.cursor/state/current_task.json.bak"
fi

# Make Python hooks executable
echo "🔧 Making hooks executable..."
chmod +x "$PROJECT_ROOT/.cursor/hooks"/*.py 2>/dev/null || true

# Update gitignore to ignore .claude but keep .cursor
echo "📝 Updating .gitignore..."
if [ -f "$PROJECT_ROOT/.gitignore" ]; then
    if ! grep -q "\.claude" "$PROJECT_ROOT/.gitignore"; then
        echo "" >> "$PROJECT_ROOT/.gitignore"
        echo "# Claude Code Sessions (migrated to .cursor/)" >> "$PROJECT_ROOT/.gitignore"
        echo ".claude/" >> "$PROJECT_ROOT/.gitignore"
    fi
fi

# Create migration log
echo "📝 Creating migration log..."
cat > "$PROJECT_ROOT/.cursor/MIGRATION_LOG.md" << EOF
# Migration from .claude/ to .cursor/

## Migration Date
$(date)

## What Was Migrated

### State Files
- DAIC mode state: \`.claude/state/daic-mode.json\` → \`.cursor/state/daic-mode.json\`
- Task state: \`.claude/state/current_task.json\` → \`.cursor/state/current_task.json\`
- All other state files migrated

### Tasks
- Active tasks: \`sessions/tasks/\` → \`tasks/\`
- Completed tasks: \`sessions/tasks/done/\` → \`tasks/done/\`

### Configuration
- Task configuration updated to include DAIC workflow settings
- Cursor commands updated to integrate with DAIC system
- Hooks adapted for Cursor's native hook system

## New Features

### Cursor Commands
- \`/create-task\` - Create new tasks with context gathering
- \`/start-task\` - Start work on existing tasks
- \`/complete-task\` - Complete tasks with agent delegation

### DAIC Workflow Integration
- Discussion/Implementation mode switching
- Tool enforcement based on current mode
- Automatic trigger phrase detection
- Branch enforcement for task consistency

### Enhanced Hooks
- User message processing with DAIC detection
- Tool enforcement and branch checking
- Session startup with task context loading
- Post-tool reminders for workflow discipline

## Next Steps

1. Test the new Cursor commands: \`/create-task test-task\`
2. Verify task state migration: Check \`.cursor/state/current_task.json\`
3. Update your workflow to use Cursor commands instead of cc-sessions
4. Remove old .claude files when ready (backup created)

## Backup Location
\`.claude.backup.$(date +%Y%m%d_%H%M%S)/\`
EOF

echo "✅ Migration completed successfully!"
echo ""
echo "📋 Summary:"
echo "  • State files migrated to .cursor/state/"
echo "  • Tasks migrated from sessions/tasks/ to tasks/"
echo "  • DAIC workflow integrated with Cursor commands"
echo "  • Hooks adapted for Cursor's native system"
echo "  • Backup created at .claude.backup.$(date +%Y%m%d_%H%M%S)/"
echo ""
echo "🚀 You can now use the new Cursor commands:"
echo "  • /create-task [name] - Create new tasks"
echo "  • /start-task [name] - Start work on tasks"
echo "  • /complete-task - Complete current task"
echo ""
echo "📖 See .cursor/MIGRATION_LOG.md for detailed information."
