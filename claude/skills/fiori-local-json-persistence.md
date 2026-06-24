---
name: fiori-local-json-persistence
description: Runbook for SAPUI5 Freestyle prototypes that use mock data and need durable localhost records. Use whenever possible when converting hardcoded arrays, JSONModel seed data, SOURCE_ROWS, BUDGET_ROWS, forecast rows, or other local mocks into JSON files with localStorage fallback and optional localhost write API.
---

# /fiori-local-json-persistence

1. Move hardcoded mock arrays and dictionaries out of controllers into `webapp/model/mockData.json` whenever the data is not purely static UI configuration.
2. Keep the JSON grouped by business purpose, not by UI widget. Prefer:
   - `monthly` for monthly series such as budget, forecast, billed, carteira and cotacoes.
   - `texts` for value-help labels such as centers and sales teams.
   - `sourceRows` for carteira/cotacao rows.
   - `budgetRows` for budget records.
   - `forecastRows` and `savedForecastRows` for user-generated forecast records.
3. Load `mockData.json` during controller initialization before decorating rows or refreshing charts/tables.
4. Keep module-level mutable variables as runtime cache only. Do not reintroduce large `const SOURCE_ROWS = [...]` or `const BUDGET_ROWS = [...]` blocks in the controller.
5. For localhost persistence, save a full snapshot to `window.localStorage` after every mutation:
   - add selected carteira/cotacao to forecast
   - add manual forecast row
   - edit forecast fields
   - delete forecast rows
   - save/confirm forecast
6. Use a namespaced storage key, for example `zsd.forecast.unrestricted.mockData.v1`, and read it before the seed JSON so browser-local changes survive reloads.
7. If the project has a local Node server, add an optional endpoint such as `/api/mock-data`:
   - `GET` returns `webapp/model/mockData.json`
   - `POST` validates JSON and writes back to `webapp/model/mockData.json`
   - keep `localStorage` as fallback because Fiori tools dev server normally cannot write files.
8. Keep `npm start` unchanged if it is the normal Fiori tools flow. Add a separate script such as `npm run start-json` for the write-enabled local server.
9. Validate after changes:
   - `node --check webapp/controller/App.controller.js`
   - `node --check server.mjs` when a server endpoint was changed
   - parse `webapp/model/mockData.json`
   - parse XML views if bindings changed
10. Explain clearly to the user which mode persists where:
   - Fiori tools: browser `localStorage`
   - local Node JSON server: `webapp/model/mockData.json`

