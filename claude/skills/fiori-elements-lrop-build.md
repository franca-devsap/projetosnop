---
name: fiori-elements-lrop-build
description: Runbook for scaffolding and wiring a Fiori Elements List Report / Object Page app against a RAP CDS root. Use when the floorplan is list-with-edit, the backend is RAP (or will be), and the customer workbook does not mandate freestyle.
---

# /fiori-elements-lrop-build

Reference template: `customers/TECFIL/BPMassUpdateMail/bp-mass-update-mail/`. When in doubt about
any structural decision, mirror that app.

## When this skill applies

- Floorplan is List Report, Object Page, Worklist, or LR+OP combo.
- There is a RAP CDS root (or one is being designed) with a transactional projection.
- The customer workbook permits Fiori Elements (TECFIL default as of 2026-05-11).
- The data shape fits one root entity (plus children/value-helps), not a custom multi-step flow.

If any condition fails, fall back to `fiori-ui5-freestyle-build` and record the reason in
customer `DECISIONS.md`.

## Pre-flight

1. Run `fiori-skill-router` first to confirm this skill was selected, not the freestyle skill.
2. Read root + customer + app `CLAUDE.md` per the standard recursive context rule.
3. Read the RAP CDS root, projection, behaviour, and service definition. If missing, request
   them from `fiori-rap-architect` before continuing.
4. Read the FE binding contract one-pager produced by `fiori-rap-architect`. If missing, stop
   and request it — do not improvise the contract.

## Steps

1. **Scaffold.** Either run `npx @sap/generator-fiori lrop` non-interactively with the
   parameters captured in the binding contract, or replicate the reference app's directory
   layout: `webapp/{Component.ts,index.html,manifest.json,resources.json,i18n/,annotations/,
   localService/mainService/}`, `package.json`, `ui5.yaml`, `ui5-mock.yaml`, `ui5-local.yaml`,
   `tsconfig.json`, `eslint.config.mjs`.
2. **Hand off to `fiori-rap-to-fe-bridge`** to author `metadata.xml`, `annotation.xml`, the
   `dataSources` block, the `pages` block, and the two yaml profiles. Do not write these
   yourself in this skill; you only orchestrate.
3. **Wire `Component.ts`** to extend `sap/suite/ui/generic/template/lib/AppComponent` with
   `manifest: "json"`. No init logic unless the binding contract specifies an extension.
4. **i18n.** Author `i18n/i18n.properties` with `appTitle`, `appDescription`, and the FLP
   inbound `flpTitle`/`flpSubtitle`. Use the customer workbook language defaults.
5. **Mock data.** Let `sap-fe-mockserver` auto-generate (`generateMockData: true`) for the
   first milestone. If the spec requires deterministic mock rows, add files under
   `webapp/localService/mainService/data/<EntitySet>.json` — never override the metadata.
6. **Smoke test.** `npm run start-mock` and verify: List Report opens, selection fields
   match the CDS `@UI.selectionField` positions, value helps load from the mock entity sets,
   editing the mandatory field persists in the mock session, readonly fields are not editable.
7. **Backend test.** `npm run start` against the gateway proxy in `ui5.yaml`. Verify the
   service responds, the entity set name matches, and no client-side rebinding is needed when
   switching from mock to productive.

## Hard rules

- No hand-written XML views, controllers, or fragments for the standard LR/OP flow. If you
  need a custom action or column, add it as an annotation extension or a Smart Templates
  extension point, not as a wholesale freestyle replacement.
- Field names in `annotation.xml` and `metadata.xml` must equal CDS element names exactly. A
  mismatch here is the single biggest cause of mock-to-productive breakage and is the failure
  mode that produced the archived TECFIL apps.
- OData V2 unless the customer workbook says otherwise.
- Update `DECISIONS.md` at the customer scope whenever you deviate from this skill.

## Done when

- `npm run start-mock` shows the List Report with the right filters, columns, value helps, and
  editable behaviour.
- The four bridge artifacts (`metadata.xml`, `annotation.xml`, manifest blocks, both yamls) are
  present and consistent with the CDS.
- `fiori-reviewer` confirms no field-name or entity-set drift versus the RAP source.
