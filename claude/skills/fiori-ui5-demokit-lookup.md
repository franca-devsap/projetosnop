---
name: fiori-ui5-demokit-lookup
description: Use whenever creating, changing, or recommending SAP Fiori/UI5 controls, layouts, actions, tables, cards, filter bars, charts, value helps, or XML view/controller patterns. Requires checking the official UI5 Demo Kit for SAPUI5/OpenUI5 version 1.147.2 first, then the closest available version if 1.147.2 is unavailable.
---

# /fiori-ui5-demokit-lookup

When generating or modifying any SAP Fiori/UI5 element, use the official UI5 Demo Kit as the source of truth before coding.

1. Check the UI5 Demo Kit version `1.147.2` first:
   - `https://ui5.sap.com/1.147.2/`
   - API reference, samples, and control documentation for the target namespace/control.
2. If version `1.147.2` is unavailable or does not contain the needed control/sample, check the nearest available UI5 version on `https://ui5.sap.com/`.
3. Prefer standard UI5/Fiori controls and properties over custom CSS or custom HTML.
4. Do not introduce custom CSS for layout or visual styling unless the user explicitly asks for a non-standard visual treatment.
5. For Fiori Freestyle apps, prefer established UI5 controls such as:
   - `sap.f.DynamicPage`, `sap.f.DynamicPageTitle`, `sap.f.DynamicPageHeader`
   - `sap.ui.comp.filterbar.FilterBar`
   - `sap.m.Table`, `sap.m.OverflowToolbar`, `sap.m.ToolbarSpacer`
   - `sap.f.Card`, `sap.f.cards.Header`
   - `sap.m.ObjectStatus`, `sap.m.ObjectNumber`, `sap.m.GenericTile`
   - `sap.viz.ui5.controls.VizFrame` when charting is already used in the app
6. Confirm the control aggregation names and XML namespace before editing XML views.
7. After XML/controller edits, validate:
   - parse XML views
   - `node --check` for changed JavaScript controllers
   - parse `manifest.json` if dependencies or libraries changed
8. In the final response, mention the Demo Kit version used when the change introduced or replaced UI5 controls.

