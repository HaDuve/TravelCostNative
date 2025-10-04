# Cursor Workflow - Task Management System

This is a Cursor-based task management system that replaces cc-sessions with native Cursor features including agent flows, custom commands, and specialized subagents.

## 🚀 Quick Start

### 1. Run Migration (if coming from cc-sessions)

```bash
node scripts/migrate-to-cursor.js
```

### 2. Create Your First Task

```
/create-task h-fix-auth-bug "Fix authentication redirect issue"
```

### 3. Start Working on a Task

```
/start-task h-fix-auth-bug
```

### 4. Complete a Task

```
/complete-task
```

## 📋 Available Commands

### Task Management Commands

| Command          | Description                                 | Usage                                                 |
| ---------------- | ------------------------------------------- | ----------------------------------------------------- |
| `/create-task`   | Create new task with context gathering      | `/create-task [priority]-[type]-[name] "Description"` |
| `/start-task`    | Start work on existing task                 | `/start-task [task-name]`                             |
| `/complete-task` | Complete current task with agent delegation | `/complete-task [optional-task-name]`                 |

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

## 🤖 Specialized Agents

### Context Gathering Agent

- **Purpose**: Creates comprehensive context manifests for tasks
- **When to use**: When creating new tasks or when tasks lack context
- **What it does**: Analyzes codebase, traces dependencies, creates detailed implementation guides

### Code Review Agent

- **Purpose**: Reviews code for quality, security, and maintainability
- **When to use**: After writing or modifying code
- **What it does**: Security scan, quality check, performance analysis

### Service Documentation Agent

- **Purpose**: Updates CLAUDE.md files with service changes
- **When to use**: After service modifications
- **What it does**: Maintains accurate service documentation

### Logging Agent

- **Purpose**: Maintains clean chronological logs and task documentation
- **When to use**: At end of context window or task completion
- **What it does**: Preserves work history and progress tracking

## 📁 File Structure

```
.cursor/
├── flows/                    # Agent flows for task management
│   ├── task-creation.json
│   ├── task-startup.json
│   └── task-completion.json
├── commands/                 # Custom slash commands
│   ├── create-task.md
│   ├── start-task.md
│   └── complete-task.md
├── agents/                   # Specialized subagents
│   ├── context-gathering.md
│   ├── code-review.md
│   ├── service-documentation.md
│   └── logging.md
├── templates/                # Task templates
│   └── task-template.md
├── state/                    # Current task state
│   └── current_task.json
└── config/                   # Configuration
    └── task-config.json

tasks/                        # Task files
├── done/                     # Completed tasks
└── [priority]-[task-name].md # Active tasks
```

## 🔄 Workflow Process

### 1. Task Creation

1. Use `/create-task` command
2. System creates task file with proper naming
3. Context-gathering agent analyzes codebase
4. Creates comprehensive context manifest
5. Sets up appropriate git branch

### 2. Task Startup

1. Use `/start-task` command
2. System validates task file
3. Sets up git branches (including submodules)
4. Updates task state
5. Loads context manifest
6. Marks task as in-progress

### 3. Task Completion

1. Use `/complete-task` command
2. Verifies success criteria are met
3. Runs specialized agents in sequence:
   - Code review agent
   - Service documentation agent
   - Logging agent
4. Archives completed task
5. Handles git operations (commit, merge, push)
6. Presents remaining tasks

## ⚙️ Configuration

### Task Configuration (`.cursor/config/task-config.json`)

```json
{
  "developer_name": "Your Name",
  "trigger_phrases": ["make it so", "go ahead"],
  "priority_prefixes": {
    "h-": "High priority",
    "m-": "Medium priority",
    "l-": "Low priority"
  },
  "task_types": {
    "implement-": "feature/",
    "fix-": "fix/",
    "refactor-": "feature/"
  }
}
```

### Current Task State (`.cursor/state/current_task.json`)

```json
{
  "task": "h-fix-auth-bug",
  "branch": "fix/auth-bug",
  "services": ["auth", "routing"],
  "updated": "2025-01-27"
}
```

## 🔧 Customization

### Adding New Commands

Create new command files in `.cursor/commands/`:

```markdown
---
description: Your command description
argument-hint: [arguments]
allowed-tools: Read, Write, Edit
---

# Your Command

Your command implementation here.
```

### Adding New Agents

Create new agent files in `.cursor/agents/`:

```markdown
---
name: your-agent
description: When to use this agent
tools: Read, Write, Edit
---

# Your Agent

Your agent implementation here.
```

### Modifying Flows

Edit flow files in `.cursor/flows/` to customize task management workflows.

## 🆚 Migration from cc-sessions

### What's Preserved

- ✅ All existing tasks and their content
- ✅ Task naming conventions and structure
- ✅ Git branch management
- ✅ Context gathering capabilities
- ✅ Agent delegation system
- ✅ Task state management

### What's New

- ✅ Native Cursor integration
- ✅ Custom slash commands
- ✅ Agent flows for automation
- ✅ Improved context management
- ✅ Better git integration

### What's Different

- Commands use `/` prefix instead of cc-sessions syntax
- Agent invocation is more streamlined
- Configuration is in `.cursor/` instead of `sessions/`
- Better integration with Cursor's native features

## 🐛 Troubleshooting

### Common Issues

**Command not found**: Ensure commands are in `.cursor/commands/` directory
**Agent not working**: Check agent files are in `.cursor/agents/` directory
**Task state issues**: Verify `.cursor/state/current_task.json` format
**Git branch problems**: Check branch naming matches task configuration

### Debug Commands

```bash
# Check current task state
cat .cursor/state/current_task.json

# List available commands
ls .cursor/commands/

# List available agents
ls .cursor/agents/

# Check git status
git status
```

## 📚 Examples

### Creating a High Priority Fix

```
/create-task h-fix-login-crash "Fix login screen crash on Android"
```

### Starting a Medium Priority Feature

```
/start-task m-implement-dark-mode
```

### Completing Current Task

```
/complete-task
```

## 🤝 Contributing

To improve this workflow system:

1. Modify agent files in `.cursor/agents/`
2. Update command files in `.cursor/commands/`
3. Adjust flow configurations in `.cursor/flows/`
4. Update templates in `.cursor/templates/`

## 📄 License

This workflow system is part of your project and follows your project's license.
