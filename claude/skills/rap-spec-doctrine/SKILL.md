---
name: rap-spec-doctrine
description: End-to-end workflow for producing project-specific RAP spec documents (DefineRapAndLogic, DefineTableSample, per-BO specs) from RapCreationOrder files. Use when a customer project ships one or more BOs that need activation-ready RAP documentation aligned to a Fiori mock contract. Orchestrates rap-orchestrator → rap-architect → rap-creator → rap-validator waves.
---

# RAP Spec Doctrine Skill

Produces project-specific RAP documentation that is activation-safe, mock-aligned, and testable per BO.

## When to invoke

- A new customer project folder contains one or more `RapCreationOrder - <BO>.txt` files.
- The user wants `DefineRapAndLogic - <Project>.txt` + `DefineTableSample - <Project>.txt` + `RAP_BO<NN>_<Name>.md` per BO.
- The project has matching Fiori mock data under `C:\VibeCoding\FioriApps\customers\<Customer>\<Project>*\`.

## Workflow

### Step 1 — Discovery (orchestrator, foreground)
Spawn `rap-orchestrator`. It produces:
- Inventory of RapCreationOrder files + Fiori mock paths
- Per-BO naming registry (16-char tables, ≤10-char SCDO/SNRO, expanded BP/CL, abbreviated SRVB)
- Locked decisions: BDEF variant, draft policy, change-docs, OData version, value-help strategy
- Pre-dispatch conflict list

**Gate**: user reviews and confirms locked decisions and conflict resolutions BEFORE step 2.

### Step 2 — Shared doctrine writers (architect + creator, foreground, serialized)
Spawn `rap-architect` once to design the shared doctrine + table samples.
Then spawn `rap-creator` (or `backend-senior` in creator hat) to write:
- `DefineRapAndLogic - <Project>.txt`
- `DefineTableSample - <Project>.txt`

**Gate**: user sanity-checks the shared doctrine before parallel BO work.

### Step 3 — Per-BO writers (architect + creator, parallel)
For each BO, spawn `rap-architect` then `rap-creator` (one pair per BO). Run BOs in parallel (independent files). Each pair produces one `RAP_BO<NN>_<Name>.md`.

### Step 4 — Validator (foreground)
Spawn `rap-validator` with all spec files in scope. It applies safe mechanical fixes (etag, draft tokens, naming drift) and produces a BLOCKER / WARNING / INFO report.

### Step 5 — Cleanup wave (backend-senior in cleanup hat, foreground)
Bundle BLOCKERS + accepted WARNINGS into one corrections brief. Dispatch a single cleanup pass. Re-run the validator.

### Step 6 — Activation-ready handoff
Validator verdict READY → user can begin Tier 1 DDIC activation.

## Required references

- Project conventions: `C:\VibeCoding\ABAP\docs\rap\NAMING_RULES.md`
- Validator checks: `C:\VibeCoding\ABAP\docs\rap\VALIDATOR_CHECKLIST.md`
- Playbook (this skill's narrative): `C:\VibeCoding\ABAP\docs\rap\ORCHESTRATION_PLAYBOOK.md`
- Generic templates: `C:\VibeCoding\ABAP\templates\rap\DefineRapAndLogic.txt`, `DefineTableSample.txt`

## Hard rules

- Do NOT skip step 1 — naming registry conflicts caught late cost more than they cost up front.
- Do NOT dispatch creators before shared doctrine exists — per-BO files reference doctrine to avoid duplication.
- Do NOT mark a BO complete without a validator pass.
- Do NOT silently resolve cross-BO disagreements — surface them to the user.
- ALWAYS attempt to read the Fiori mock metadata.xml + JSON; if blocked, document `[INFERRED FROM DOMAIN]` fields explicitly.

## Anti-patterns

- Writing all per-BO files first and validating at the end → conflicts compound across files; do step 4 once but plan for at least one cleanup pass.
- Picking the "obvious" side of a RapCreationOrder vs template conflict without asking → user has authority context the docs lack.
- Treating the Fiori mock as advisory → mock entity-set aliases are FROZEN by the UI bindings.
