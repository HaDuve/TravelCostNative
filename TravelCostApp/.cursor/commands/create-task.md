---
description: Create a new task with priority prefix and context gathering
argument-hint: [priority]-[type]-[name] "Description"
allowed-tools: Read, Write, Edit, Bash, MultiEdit
---

# Create New Task

## Context

- Current directory: !`pwd`
- Git status: !`git status --porcelain`
- Current branch: !`git branch --show-current`
- Available tasks: !`ls -la tasks/ 2>/dev/null || echo "No tasks directory found"`
- DAIC mode: !`cat .cursor/state/daic-mode.json 2>/dev/null || echo "discussion"`

## Task Creation Process

I'll help you create a new task following the Cursor task management conventions:

### Priority Prefixes

- `h-` → High priority
- `m-` → Medium priority
- `l-` → Low priority
- `?-` → Investigate (speculative)

### Task Types

- `implement-` → Creates feature/ branch
- `fix-` → Creates fix/ branch
- `refactor-` → Creates feature/ branch
- `research-` → No branch needed
- `experiment-` → Creates experiment/ branch
- `migrate-` → Creates feature/ branch
- `test-` → Creates feature/ branch
- `docs-` → Creates feature/ branch

## Your Task

**Task Name**: $ARGUMENTS

Please provide:

1. A clear description of what needs to be built/fixed/refactored
2. Specific, measurable success criteria
3. Any special requirements or constraints

I'll then:

1. Create the task file with proper naming convention
2. Set up the appropriate git branch
3. Run the context-gathering agent to create a comprehensive manifest
4. Update the task state
5. Ensure DAIC workflow is properly initialized

**Note**: This command works in both Discussion and Implementation modes. In Discussion mode, I'll create the task structure and gather context. In Implementation mode, I'll proceed with immediate setup.

Let's get started!
