---
description: Complete current task with agent delegation and git operations
argument-hint: [optional-task-name]
allowed-tools: Read, Write, Edit, Bash, MultiEdit
---

# Complete Task

## Context

- Current directory: !`pwd`
- Git status: !`git status --porcelain`
- Current branch: !`git branch --show-current`
- Current task state: !`cat .cursor/state/current_task.json 2>/dev/null || echo "No current task"`
- Unstaged changes: !`git diff --name-only`

## Task Completion Process

I'll help you complete the current task: **$ARGUMENTS**

### Pre-completion Checks

- Verify all success criteria are met
- Check for any unaddressed work

### Agent Delegation (in order):

1. **Code Review Agent** - Reviews all implemented code for security/quality
2. **Service Documentation Agent** - Updates CLAUDE.md files with service changes
3. **Logging Agent** - Finalizes task documentation and work log

### Git Operations

- Review unstaged changes and commit preferences
- Handle super-repo vs standard repo differently
- Commit changes with descriptive messages
- Merge branches based on task type (subtask → parent, regular → main)
- Push merged branches

### Task Archival

- Move completed task to done/ directory
- Clear current task state
- Present remaining tasks for selection

### Special Cases

- **Experiment branches**: Ask whether to keep for reference
- **Research tasks**: No merging needed, just document findings

Ready to complete this task?
