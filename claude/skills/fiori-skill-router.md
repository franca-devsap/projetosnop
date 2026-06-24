---
name: fiori-skill-router
description: Mandatory first-step router for FioriApps work. Use at the start of any non-trivial task to select one or more skills before reading deep docs or editing code.
---

# /fiori-skill-router

1. Identify whether the active scope is root portfolio, one customer, or one app inside one customer.
2. Classify the task. Apply the floorplan gate FIRST:
   - **Floorplan gate (run before any UI skill is chosen):** if the task targets a single RAP
     root with a transactional projection and the floorplan is List Report, Object Page,
     Worklist, or LR+OP combo -> select `fiori-elements-lrop-build`, NOT
     `fiori-ui5-freestyle-build`. Freestyle is only correct when (a) no RAP root exists,
     (b) the floorplan is not LR/OP/Worklist/OVP/AnalyticalLP, or (c) the customer workbook
     explicitly mandates freestyle with a recorded `DECISIONS.md` entry. Mis-routing this gate
     is the documented root cause of the archived TECFIL apps under
     `customers/TECFIL/_archive/` — do not repeat.
   - Fiori Elements LROP scaffolding, annotations-driven UI -> `fiori-elements-lrop-build`
   - SAPUI5 freestyle, XML views, fragments, JSONModel, controller logic -> `fiori-ui5-freestyle-build`
   - UI layout, accessibility, visual behavior, React, CSS, component work -> `fiori-frontend-build`
   - RAP, CDS, BDEF, service definition, service binding, annotations -> `fiori-rap-build`
   - SAP tables, ERD, DDIC mapping, value-help source modeling -> `fiori-ddic-erd-map`
   - JSONModel to OData/RAP migration -> `fiori-json-to-odata-migration`
   - CAP, Node, API, service logic, integration handlers -> `fiori-backend-build`
   - schema, persistence, CDS, DB, migrations -> `fiori-database-change`
   - architecture docs, stack shifts, onboarding structure, cross-customer design -> `fiori-architect-work`
3. State the chosen skill set before substantial edits.
4. Read only the docs required by those skills.
5. If no skill fits, create or extend one in `.claude/skills/` before continuing.
