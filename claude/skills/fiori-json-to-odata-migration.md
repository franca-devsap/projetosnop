---
name: fiori-json-to-odata-migration
description: Runbook for moving SAPUI5 apps from local JSONModel or mock data to OData or RAP-backed services. Use when a frontend-first app is about to gain a real backend.
---

# /fiori-json-to-odata-migration

1. Read root context first, then customer workbook, then the app's current frontend and backend architecture docs.
2. Confirm the current frontend data model shape from live code, not from stale docs.
3. Map each JSON collection and client-side mutation flow to its target OData or RAP entity/action.
4. Identify frontend assumptions that will break on service integration: local IDs, client-side timestamps, optimistic writes, denormalized arrays, and hardcoded catalogs.
5. Define the cutover path in stages: model contract, read path, write path, dialogs, value helps, and exports.
6. Update checkpoints and architecture docs when the source of truth changes from local model to service model.
