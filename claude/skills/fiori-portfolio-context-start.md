---
name: fiori-portfolio-context-start
description: Portfolio startup context bootstrap for FioriApps. Use at the beginning of any new FioriApps session, especially root-level or multi-customer work, when an agent needs a fresh architectural picture before orchestration or implementation.
---

# /fiori-portfolio-context-start

## Read order

1. Root `CLAUDE.md`
2. Root `AGENTS.md`
3. `docs/SHARED_CONVENTIONS.md`
4. `docs/DESIGN_SYSTEM.md`
5. `docs/ENGINEERING_WORKFLOW.md`
6. `docs/STARTUP_ORDER.md`
7. `docs/SOLUTIONS_OVERVIEW.md`
8. `docs/WORKING_SAMPLE_CBC_COMPETENCYGROUP.md` when the task is about shared Fiori app structure, SAPUI5 patterns, RAP planning, or no real customer app is onboarded yet.
9. Latest root portfolio reports:
   - `checkpoints/*-portfolio-positioning-technical-report.md`
   - `checkpoints/*-portfolio-positioning-functional-report.md`
   - `checkpoints/*-portfolio-positioning-checkpoint.md`
10. Only after that, read the nearest customer startup-order file plus the nearest customer `CLAUDE.md` / `AGENTS.md`.
11. Only after customer scope is active, read the nearest app startup-order file plus the nearest app `CLAUDE.md` / `AGENTS.md`.

## Rules

- At portfolio scope, stop at root context unless the task explicitly narrows to a customer.
- Customer-level startup inherits root context; root context does not inherit customer context.
- App-level startup inherits root context first and customer context second; root context does not inherit app context.
- If the reports are stale relative to the repo, run `/fiori-portfolio-checkpoint-refresh` first.
