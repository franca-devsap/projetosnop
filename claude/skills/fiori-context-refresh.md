---
name: fiori-context-refresh
description: Refresh the project context snapshot for the current customer workspace. Reads minimum files, detects changes, updates CONTEXT_SNAPSHOT.md only if needed. Use at session start, after long work, or after idle gaps.
---

# /fiori-context-refresh

## Purpose

Efficiently refresh the CONTEXT_SNAPSHOT.md for the active customer workspace.
This replaces the need to re-read 8+ architecture docs at session boundaries.

## When to use

- At the start of any CBC LMS session
- After 1 hour of continuous work in a session
- After 10+ minutes of idle in an active session
- After any ERD.txt modification
- When context feels stale or after context window compression

## Execution

1. Identify the active customer workspace (default: nearest CLAUDE.md with CONTEXT_SNAPSHOT.md)
2. Invoke the `fiori-context-gatherer` agent against that workspace
3. Report the result to the user in 2-3 lines

## Expected cost

- No-change run: ~10 tool calls, ~15k tokens
- Full refresh: ~20 tool calls, ~30k tokens
- Compare: full doc re-read was 57 tool calls, 66k tokens

## Integration with session flow

This skill should be the FIRST thing invoked when entering a CBC LMS workspace,
replacing the heavier `/fiori-portfolio-context-start` for customer-scoped work.

For portfolio-level (multi-customer) sessions, continue using `/fiori-portfolio-context-start`.
