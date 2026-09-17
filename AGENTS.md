# Repository Instructions

## Git worktrees

When working on a feature, keep the work isolated. Use this command to create a Git branch, a worktree, and a Neon branch:

```bash
pnpm feature:new <feature-name> [base-ref]
```

Example:

```bash
pnpm feature:new add-login main
```

The script normalizes the feature name. It uses `feature/<normalized-feature-name>` for the Git and Neon branches, and `.worktrees/<normalized-feature-name>` for the worktree.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
