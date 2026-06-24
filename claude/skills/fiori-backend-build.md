---
name: fiori-backend-build
description: Runbook for FioriApps backend and service implementation. Use for CAP services, Node backends, API behavior, integration handlers, shared schemas, request validation, and backend tests inside a customer workspace.
---

# /fiori-backend-build

1. Read root context first, then the nearest customer `CLAUDE.md` and technical workbook, then the nearest app docs if the task is app-specific.
2. Check current code before trusting planned route or service maps in docs.
3. If the backend target is RAP or OData for a UI5 app, pair this skill with `/fiori-rap-build`.
4. Define or update shared schemas first.
5. Keep service registration, plugin order, and handler boundaries explicit.
6. Put validation at the boundary and persistence in query or service layers.
7. Pair DB-affecting work with `fiori-database-change`.
