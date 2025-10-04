---
description: Start work on an existing task with git setup and context loading
argument-hint: [task-name]
allowed-tools: Read, Write, Edit, Bash, MultiEdit
---

# Start Task

## Context

- Current directory: !`pwd`
- Git status: !`git status --porcelain`
- Current branch: !`git branch --show-current`
- Available tasks: !`ls -la tasks/ 2>/dev/null || echo "No tasks directory found"`
- Current task state: !`cat .cursor/state/current_task.json 2>/dev/null || echo "No current task"`

## Task Startup Process

I'll help you start work on task: **$ARGUMENTS**

### What I'll do:

1. **Validate Task File** - Check if task exists and is properly formatted
2. **Git Setup** - Create/checkout appropriate branches for task and submodules
3. **Update Task State** - Set this as the current active task
4. **Load Context Manifest** - Load comprehensive context from task file
5. **Verify Branch State** - Ensure all modules are on correct branches
6. **Update Task Status** - Mark as in-progress with start date

### Branch Management

- For super-repos: Creates matching branches in ALL affected submodules
- For regular repos: Simple branch creation/checkout
- Handles both new and existing branches

### Context Loading

- Loads the context manifest created by context-gathering agent
- Provides narrative explanation of how systems work
- Includes technical reference details for implementation

Ready to start work on **$ARGUMENTS**?
