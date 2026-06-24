# ABAP RAP Clean Backend Skill

Use this skill when creating, reviewing, or refactoring ABAP CDS/RAP backend code in this workspace.

## Goal

Produce professional RAP backend code where behavior pools stay thin and delegate business logic to global SE24 classes. Follow the activation-safe style proven by `ZCL_SFR_SUPPLIER_FCST_LOGIC`.

## Workflow

1. Read the CDS/BDEF/service model first.
2. Identify:
   - root view entity
   - projection view entity
   - behavior implementation class
   - entity alias
   - actions and parameter entities
   - failed/reported/result table shapes
3. Create or update a global logic class using SE24-compatible declarations:
   - `PUBLIC FINAL CREATE PUBLIC`
   - public `TYPES ... TYPE TABLE FOR ...`
   - `CLASS-DATA` singleton reference
   - `CLASS-METHODS get_instance`
   - static methods for each behavior operation
4. Keep local RAP handler/saver methods as delegation only.
5. In global class methods, append directly to entity-specific parameters:
   - `APPEND ... TO c_failed`
   - `APPEND ... TO c_reported`
   - do not use `c_failed-<entity>` after passing `failed-<entity>` into the method.
6. Validate activation risks:
   - exact CDS/BDEF names
   - exact action names and case
   - `%param-*` field names
   - missing projection `use action`
   - unsupported `TYPE RESPONSE FOR ... EARLY/LATE` in SE24

## Preferred RAP Pattern

Behavior pool:

```abap
METHOD action_name.
  zcl_object_logic=>get_instance( )->action_name(
    EXPORTING i_keys = keys
    CHANGING  c_failed = failed-entity
              c_reported = reported-entity
              c_result = result ).
ENDMETHOD.
```

Global class:

```abap
TYPES y_t_action TYPE TABLE FOR ACTION IMPORT z_i_object~action_name .
TYPES y_t_action_result TYPE TABLE FOR ACTION RESULT z_i_object~action_name .
TYPES y_t_reported TYPE TABLE FOR REPORTED z_i_object .
TYPES y_t_failed TYPE TABLE FOR FAILED z_i_object .
```

## Fixed Points From This Workspace

- `TYPE RESPONSE FOR REPORTED EARLY/LATE` was avoided because SE24 activation failed in this environment.
- `CREATE PRIVATE` was avoided because the local recommended pattern uses `CREATE PUBLIC`.
- `c_failed-massupdatemail` is invalid inside the global class when `c_failed` is typed as `TYPE TABLE FOR FAILED ...`.
- The mass e-mail model uses `updateEmailMass`, not `ChangeEmail`, in `RAP Model.txt`.

