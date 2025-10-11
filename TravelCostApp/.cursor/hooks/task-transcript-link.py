#!/usr/bin/env python3
"""Task transcript link hook - adapted for Cursor."""
import json
import sys
from pathlib import Path
from shared_state import get_project_root

# Load input
input_data = json.load(sys.stdin)
tool_name = input_data.get("tool_name", "")
tool_input = input_data.get("tool_input", {})
transcript_path = input_data.get("transcript_path", "")

# This hook is called before Task tool usage
# It can be used to set up subagent context or other pre-task operations

# Check if we're starting a subagent task
if tool_name == "Task":
    project_root = get_project_root()
    subagent_flag = project_root / '.cursor' / 'state' / 'in_subagent_context.flag'

    # Create flag to indicate we're in a subagent context
    subagent_flag.parent.mkdir(parents=True, exist_ok=True)
    subagent_flag.touch()

# Allow task to proceed
sys.exit(0)
