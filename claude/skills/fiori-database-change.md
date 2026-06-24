---
name: fiori-database-change
description: Runbook for FioriApps persistence work. Use for database schema changes, CDS/data-model changes, migrations, query structure, and stored-data updates inside a customer workspace.
---

# /fiori-database-change

1. Read root context first, then the nearest customer `CLAUDE.md`, architecture doc, technical workbook, and decision log.
2. If the source material is an ERD, `SapTables.md`, or table workbook, start with `/fiori-ddic-erd-map`.
3. Verify whether the documented schema matches the code.
4. Update schema and shared contracts intentionally.
5. Generate or hand-write migrations in the customer's existing flow.
6. Report destructive migration risk explicitly.
