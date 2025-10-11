#!/bin/bash
# Status line script for Cursor - adapted from .claude/ system

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "No git repository"
    exit 0
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

# Check DAIC mode
DAIC_MODE="unknown"
if [ -f "$PROJECT_ROOT/.cursor/state/daic-mode.json" ]; then
    DAIC_MODE=$(grep -o '"mode":"[^"]*"' "$PROJECT_ROOT/.cursor/state/daic-mode.json" | cut -d'"' -f4)
fi

# Check current task
CURRENT_TASK="none"
if [ -f "$PROJECT_ROOT/.cursor/state/current_task.json" ]; then
    CURRENT_TASK=$(grep -o '"task":"[^"]*"' "$PROJECT_ROOT/.cursor/state/current_task.json" | cut -d'"' -f4)
    if [ "$CURRENT_TASK" = "null" ] || [ -z "$CURRENT_TASK" ]; then
        CURRENT_TASK="none"
    fi
fi

# Format output
if [ "$CURRENT_TASK" != "none" ]; then
    echo "📋 $CURRENT_TASK | 🌿 $CURRENT_BRANCH | 🔄 $DAIC_MODE"
else
    echo "🌿 $CURRENT_BRANCH | 🔄 $DAIC_MODE"
fi
