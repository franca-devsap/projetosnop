---
description: Bootstrap RAP spec docs for the current customer/project folder. Walks the rap-spec-doctrine workflow (orchestrator → architect → creator → validator → cleanup).
---

You are bootstrapping RAP spec documentation for the current customer project. Invoke the **rap-spec-doctrine** skill workflow.

## Steps

1. Confirm the working directory looks like a customer project (contains `RapCreationOrder - *.txt` files).
2. Spawn the `rap-orchestrator` agent. Wait for its inventory + naming registry + conflict list.
3. Present locked decisions and conflicts to the user. Wait for adjudication.
4. Spawn `rap-architect` + `rap-creator` (serialized) to produce shared doctrine files `DefineRapAndLogic - <Project>.txt` and `DefineTableSample - <Project>.txt`.
5. Show diffs / summaries; wait for user OK.
6. Spawn `rap-architect` + `rap-creator` per BO in parallel. Wait for all to land.
7. Spawn `rap-validator`. Surface the report. Wait for cleanup adjudication.
8. Spawn `backend-senior` in cleanup hat with corrections brief.
9. Re-spawn `rap-validator` until verdict READY.
10. Report final file list with activation status.

## Inputs

Arguments (optional): the BO name to scope to (default: all BOs in the folder).

## Reference

`C:\VibeCoding\ABAP\.claude\skills\rap-spec-doctrine\SKILL.md`
