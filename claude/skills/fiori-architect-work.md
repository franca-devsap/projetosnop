---
name: fiori-architect-work
description: Runbook for FioriApps architecture and system-shape decisions. Use for customer technical workbook setup, stack changes, new subsystems, document restructuring, onboarding patterns, and cross-customer design decisions.
---

# /fiori-architect-work

1. Read the root startup-order file and root `CLAUDE.md` first.
2. If the work is customer-specific, read the customer startup-order file and technical workbook next.
3. If the work is app-specific, read the app startup-order file and app docs after customer context is loaded.
4. Read architecture docs before making assumptions.
5. Define the boundary being changed: stack, deployment, transport, integration, persistence, auth, UI shell, workflow, or app decomposition.
6. Decide whether the rule belongs in a root doc, a customer doc, an app doc, or a skill.
7. Update decision records before or with implementation when the change is architectural.
8. Hand off execution to UI5, frontend, backend, RAP, or database skills after the architecture is clear.
