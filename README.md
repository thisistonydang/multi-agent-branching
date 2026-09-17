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

## Run all tasks with pi-subagents

Install [`pi-subagents`](https://github.com/nicobailon/pi-subagents), start Pi in this repository, and run:

```text
/task-fleet
```

The project prompt prepares one Git worktree and Neon branch per task in `tasks.json`, then launches one parallel worker in each worktree. Open `/subagents-fleet` to watch the workers.

The repository must be clean before launching the fleet. Preview what will be created without changing anything:

```bash
pnpm fleet:prepare --dry-run
```
