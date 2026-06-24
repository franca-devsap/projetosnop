---
name: fiori-rap-build
description: Runbook for SAP RAP application and service work. Use for CDS entities, projections, BDEF, service definitions, service bindings, draft behavior, and Fiori Elements or UI5 service preparation.
---

# /fiori-rap-build

1. Read root context first, then customer workbook, then app architecture docs.
2. Start from `/fiori-ddic-erd-map` if the source of truth is table notes, ERD files, or workbook definitions.
3. Separate design from implementation: identify which RAP artifacts are only planned and which are already live.
4. Keep entity hierarchy, composition boundaries, and key mapping explicit before generating view code.
5. Record draft, locking, and activation-order assumptions clearly.
6. If the frontend already exists on local JSONModel, pair with `/fiori-json-to-odata-migration`.
7. Hand off app UI integration through `/fiori-skill-router`: use `/fiori-elements-lrop-build` for RAP LR/OP/Worklist apps, and `/fiori-ui5-freestyle-build` only when the floorplan or customer decision requires freestyle.
