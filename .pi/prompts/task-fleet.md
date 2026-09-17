---
description: Launch one isolated worker for every task in tasks.json
---
Launch the repository task fleet with pi-subagents.

1. Read `tasks.json` and `AGENTS.md`.
2. Run `pnpm fleet:prepare` from the repository root. Stop and report the exact error if preparation fails.
3. Parse the `TASK_FLEET_MANIFEST=` line printed by that command.
4. Make exactly one top-level `subagent` workflow call with `async: true`.
5. Inside that workflow, use `runs.all` to launch one `worker` for every manifest task.
6. Give each worker:
   - `cwd` set to its absolute `worktreePath` from the manifest.
   - `context: "fresh"`.
   - `worktree: false`, because the worktree and Neon branch already exist.
   - A task telling it to read `tasks.json`, implement only its matching task ID, follow `AGENTS.md`, apply migrations only to its assigned Neon branch, create and verify its isolation marker, run every verification command, commit all changes, and never merge.
7. Set a generous workflow timeout. Do not set a hard tool budget for the workers.
8. Return the workflow receipt, run ID, task IDs, Git branches, Neon branches, and worktree paths.
9. Tell the operator to use `/subagents-fleet` to watch progress.

If a subagent launch or workflow fails, do not switch to another execution method. Report the failure and preserve each worktree for inspection.
