# Repository Instructions

## Git worktrees

When working on a feature, keep the work isolated. Use this command to create a Git branch, a worktree, and a Neon branch:

```bash
npm run feature:new -- <feature-name> [base-ref]
```

Example:

```bash
npm run feature:new -- add-login main
```

The script normalizes the feature name. It uses `feature/<normalized-feature-name>` for the Git and Neon branches, and `.worktrees/<normalized-feature-name>` for the worktree.
