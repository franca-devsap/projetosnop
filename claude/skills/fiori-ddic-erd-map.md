---
name: fiori-ddic-erd-map
description: Runbook for mapping SAP tables, ERDs, and workbook data structures into an app-ready domain model. Use before RAP design, persistence work, or UI value-help planning.
---

# /fiori-ddic-erd-map

1. Read root context first, then customer workbook, then the app architecture and data-model docs.
2. Use the ERD, `SapTables.md`, workbook tables, and related notes to identify root entities, child entities, keys, texts, and master-data dependencies.
3. List open data-model gaps explicitly: missing tables, ambiguous keys, soft-delete rules, language handling, and value-help sources.
4. Distinguish transactional entities from text/master data entities.
5. Produce the mapping needed by the next step: UI model, RAP entity hierarchy, or persistence schema.
6. If the app already runs on JSON data, compare the live JSON shape with the designed DDIC shape before backend generation.
