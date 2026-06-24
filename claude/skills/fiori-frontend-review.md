---
name: fiori-frontend-review
description: Run /fiori-frontend-review after any UI change in a FioriApps customer workspace. Audits the diff against SAP Fiori defaults or the customer design workbook and reports accessibility, consistency, and pattern drift.
---

# /fiori-frontend-review

1. Detect customer scope.
2. Read the customer design workbook first; fall back to root `docs/DESIGN_SYSTEM.md`.
3. Read the changed UI files.
4. Review for:
   - design-source compliance
   - accessibility
   - responsive behavior
   - customer pattern consistency
5. Report blockers, important issues, nice-to-haves, and a verdict.

