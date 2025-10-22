---
description: Complete task workflow that creates, starts, and completes tasks in sequence
argument-hint: [priority]-[type]-[name] "Description"
allowed-tools: Read, Write, Edit, Bash, MultiEdit
---

# Task Workflow

## Context

- Current directory: !`pwd`
- Git status: !`git status --porcelain`
- Current branch: !`git branch --show-current`
- Available tasks: !`ls -la tasks/ 2>/dev/null || echo "No tasks directory found"`
- Current task state: !`cat .cursor/state/current_task.json 2>/dev/null || echo "No current task"`
- Unstaged changes: !`git diff --name-only`
- DAIC mode: !`cat .cursor/state/daic-mode.json 2>/dev/null || echo "discussion"`

## Complete Task Workflow

I'll execute the complete task workflow for: **$ARGUMENTS**

### Stage 1: Task Creation Process

I'll help you create a new task following the Cursor task management conventions:

#### Priority Prefixes

- `h-` → High priority
- `m-` → Medium priority
- `l-` → Low priority
- `?-` → Investigate (speculative)

#### Task Types

- `implement-` → Creates feature/ branch
- `fix-` → Creates fix/ branch
- `refactor-` → Creates feature/ branch
- `research-` → No branch needed
- `experiment-` → Creates experiment/ branch
- `migrate-` → Creates feature/ branch
- `test-` → Creates feature/ branch
- `docs-` → Creates feature/ branch

#### Creation Process

1. Create the task file with proper naming convention
2. **REQUIRED: Set up the appropriate git branch** - Branch creation is mandatory for all task types except research
3. Run the context-gathering agent to create a comprehensive manifest
4. Update the task state
5. Ensure DAIC workflow is properly initialized

**Note**: This command works in both Discussion and Implementation modes. In Discussion mode, I'll create the task structure and gather context. In Implementation mode, I'll proceed with immediate setup.

### Stage 2: Task Startup Process

I'll help you start work on the created task:

#### What I'll do:

1. **Validate Task File** - Check if task exists and is properly formatted
2. **REQUIRED: Git Setup** - Create/checkout appropriate branches for task and submodules
3. **Update Task State** - Set this as the current active task
4. **Load Context Manifest** - Load comprehensive context from task file
5. **REQUIRED: Verify Branch State** - Ensure all modules are on correct branches
6. **Update Task Status** - Mark as in-progress with start date
7. **DAIC Mode Check** - Ensure proper workflow mode is set

#### REQUIRED: Branch Management

- **MANDATORY**: For super-repos: Creates matching branches in ALL affected submodules
- **MANDATORY**: For regular repos: Simple branch creation/checkout
- **REQUIRED**: Handles both new and existing branches
- **REQUIRED**: Enforces branch naming conventions based on task type

#### Context Loading

- Loads the context manifest created by context-gathering agent
- Provides narrative explanation of how systems work
- Includes technical reference details for implementation

#### DAIC Workflow Integration

- **Discussion Mode**: Focus on planning and analysis
- **Implementation Mode**: Ready for immediate coding
- Automatic mode switching based on trigger phrases
- Tool enforcement based on current mode

### Stage 3: Task Completion Process

I'll help you complete the current task:

#### Pre-completion Checks

- Verify all success criteria are met
- Check for any unaddressed work

#### Agent Delegation (in order):

1. **Code Review Agent** - Reviews all implemented code for security/quality
2. **Service Documentation Agent** - Updates CLAUDE.md files with service changes
3. **Logging Agent** - Finalizes task documentation and work log

#### REQUIRED: Git Operations

- Review unstaged changes and commit preferences
- **MANDATORY**: Handle super-repo vs standard repo differently
- **REQUIRED**: Commit changes with descriptive messages
- **MANDATORY**: Merge branches based on task type (subtask → parent, regular → main)
- **REQUIRED**: Push merged branches

#### Task Archival

- Move completed task to done/ directory
- Clear current task state
- Present remaining tasks for selection

#### Special Cases

- **Experiment branches**: Ask whether to keep for reference
- **Research tasks**: No merging needed, just document findings

## CRITICAL: Branch Requirements Summary

**MANDATORY Branch Operations Throughout Workflow:**

1. **Stage 1 (Creation)**: Create appropriate branch based on task type
2. **Stage 2 (Startup)**: Verify and setup branches in all affected modules
3. **Stage 3 (Completion)**: Merge branches according to task type and push changes

**Branch Naming Conventions:**

- `feature/` for implement-, refactor-, migrate-, test-, docs- tasks
- `fix/` for fix- tasks
- `experiment/` for experiment- tasks
- No branch for research- tasks

## Workflow Integration

- **Context Loading**: Loads comprehensive context manifest
- **DAIC Mode**: Automatic switching between Discussion and Implementation modes
- **Tool Enforcement**: Based on current workflow stage and mode
- **Continuous Progress**: Seamless flow from creation through completion

Ready to execute the complete task workflow?
