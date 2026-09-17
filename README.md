# Parallel agents with Git worktrees and Neon branches

This demo launches one Pi subagent for every task in `tasks.json`. Each agent receives its own Git worktree, Git branch, and Neon database branch. Pi shows the agents in a visual fleet view while they work in parallel.

## Prerequisites

Install and configure:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) 20.19 or newer
- [pnpm](https://pnpm.io/) 10 or newer
- [Neon CLI](https://neon.com/docs/cli/install) 4.15 or newer, with a Neon account
- [Pi](https://pi.dev/), with a model provider configured
- [pi-subagents](https://github.com/nicobailon/pi-subagents)

## Run the demo

### 1. Clone the repository

```bash
git clone <repository-url>
cd multi-agent-branching
```

### 2. Install dependencies

```bash
pnpm install --frozen-lockfile
```

### 3. Connect a Neon project

Sign in if needed, link a project, select or create its `main` branch, and apply the base migration:

```bash
neon login
neon link
neon checkout main --create
pnpm db:migrate
```

The Neon commands create ignored `.neon` and `.env.local` files. Do not commit them.

### 4. Install pi-subagents

```bash
pi install npm:pi-subagents
```

### 5. Start Pi

```bash
pi
```

Accept the project trust prompt so Pi can load the repository command under `.pi/prompts/`. Use `/login` first if Pi still needs model authentication.

Check the subagent installation:

```text
/subagents-doctor
```

### 6. Launch the task fleet

```text
/task-fleet
```

The command reads `tasks.json`, creates the matching Git and Neon branches, and starts one worker per task. The main repository must be clean before launch.

### 7. Watch the agents

```text
/subagents-fleet
```

The fleet view shows each agent's status, current activity, transcript, and controls. Pi also reports each completed branch and commit in the main conversation.

## Inspect the results

After every agent finishes:

```bash
git worktree list
neon branches list
```

Open a feature worktree and run its version of the app, for example:

```bash
cd .worktrees/task-priority
pnpm dev
```

Do not merge the branches without reviewing them. The demo tasks intentionally make overlapping Drizzle schema changes, so integration requires resolving the final schema and migrations.

## Clean up

Cleanup permanently deletes the task worktrees, their local Git branches, and their matching Neon branches. Review or merge any work you want to keep first.

Preview the cleanup:

```bash
pnpm fleet:clean --dry-run
```

Run it:

```bash
pnpm fleet:clean --yes
```

The cleanup refuses to delete a worktree with uncommitted changes. To intentionally discard those changes, use `pnpm fleet:clean --yes --force`.
