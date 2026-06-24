---
name: fiori-ui5-freestyle-build
description: Runbook for SAPUI5 freestyle application work. Use for XML views, JS controllers, fragments, manifest routing, JSONModel logic, UI5 tooling, and local mock-data flows.
---

# /fiori-ui5-freestyle-build

1. Read root context first, then the nearest customer context, then the nearest app context.
2. Treat `manifest.json`, `Component.js`, the active controllers, and active views as the runtime source of truth.
3. Do not trust generator `README.md` files until they match the code.
4. Confirm the active model type before changing behavior: `JSONModel`, OData V2, OData V4, or mock server.
5. Keep view logic in XML/fragments and keep orchestration logic in controllers or extracted UI5 helpers.
6. When controllers become large, extract reusable formatter, model, or service helpers rather than growing one controller further.
7. Pair with `/fiori-frontend-build` for visual or UX changes.
8. Pair with `/fiori-json-to-odata-migration` when backend service integration begins.
