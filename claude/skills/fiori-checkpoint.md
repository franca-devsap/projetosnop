---
name: fiori-checkpoint
description: End-of-session checkpoint writer for FioriApps. Run /fiori-checkpoint at the end of any non-trivial customer or app session to drop a snapshot at the right scope, and chain the root portfolio refresh when the session also changed shared or cross-customer context.
---

# /fiori-checkpoint

1. Detect whether the active scope is customer-level or app-level.
2. Read the nearest `docs/SESSION_CHECKPOINT.template.md`.
3. Write the checkpoint into the nearest local `checkpoints/` folder.
4. Fill all sections from actual session context.
5. Update the nearest `docs/LESSONS_LEARNED.md` if a recurring correction appeared.
6. If the session changed customer-wide context and the active scope was app-level, also update the customer checkpoint.
7. If the session changed shared root docs, shared skills, root rules, or cross-customer architecture conclusions, also run `/fiori-portfolio-checkpoint-refresh`.
8. Keep checkpoints at their owning scope only.
