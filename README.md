# Agent Task Board

A minimal task board for demonstrating parallel development with Git worktrees and Neon branches.

## What it does

- Creates tasks
- Assigns an optional agent name
- Updates task status
- Deletes tasks
- Stores all tasks in Lakebase Postgres on Neon

## Setup

Install dependencies:

```bash
pnpm install
```

Link the repository to a Neon project and pull its environment variables:

```bash
neon link
neon env pull
```

Generate a Drizzle migration after changing `lib/schema.ts`:

```bash
pnpm db:generate
```

Apply pending migrations with the direct database connection:

```bash
pnpm db:migrate
```

Open Drizzle Studio when you want to inspect the data:

```bash
pnpm db:studio
```

Start the app:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Create an isolated feature environment

```bash
pnpm feature:new <feature-name> [base-ref]
```

This creates a matching Git branch, worktree, and Neon branch. The worktree receives its own Neon environment variables.
