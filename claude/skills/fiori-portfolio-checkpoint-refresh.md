---
name: fiori-portfolio-checkpoint-refresh
description: Refresh the root FioriApps portfolio reports and checkpoint after any material root-level, multi-customer, or architecture-shaping session. Use when the next startup agent needs a fresh portfolio view rather than stale narrative docs.
---

# /fiori-portfolio-checkpoint-refresh

1. Regenerate the portfolio reports by running `node scripts/portfolio-positioning-report.mjs`.
2. Read the regenerated technical and functional reports.
3. Rewrite the root checkpoint file for the current date at `checkpoints/YYYY-MM-DD-portfolio-positioning-checkpoint.md`.
4. Record session goal, files changed, commands/tests run, contradictions/gaps, decisions to revisit, and next-session startup actions.
5. Keep root checkpoint files in the root `checkpoints/` folder only.

