---
name: fiori-customer-init
description: Scaffold a new customer workspace in FioriApps from the shared customer template. Use when the user says "create a new customer workspace called <Name>" or "bootstrap customer <Name>".
---

# /fiori-customer-init

1. Create `customers/<CustomerName>/` from `templates/customer-workspace/`.
2. Create `customers/<CustomerName>/apps/` as the default home for app workspaces.
3. Fill in the customer name and one-line purpose.
4. Add a row to `docs/SOLUTIONS_OVERVIEW.md`.
5. Do not generate app code in this step.
