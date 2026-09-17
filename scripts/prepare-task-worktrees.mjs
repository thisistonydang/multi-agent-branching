#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  console.log(`Usage: pnpm fleet:prepare [--dry-run]\n\nReads tasks.json and creates one Git worktree and Neon branch per task.\nThe repository must be clean unless --dry-run is used.`);
  process.exit(0);
}

const supportedArgs = new Set(["--dry-run"]);
for (const arg of args) {
  if (!supportedArgs.has(arg)) {
    console.error(`Unknown argument: ${arg}`);
    process.exit(2);
  }
}

const dryRun = args.has("--dry-run");
const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();

if (!dryRun) {
  const status = execFileSync("git", ["status", "--porcelain"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();

  if (status) {
    console.error("The repository must be clean. Commit or stash changes before launching the task fleet.");
    process.exit(1);
  }
}

const taskPlan = JSON.parse(readFileSync(resolve(repoRoot, "tasks.json"), "utf8"));
const baseRef = taskPlan.workflow?.baseRef ?? "main";

if (!Array.isArray(taskPlan.tasks) || taskPlan.tasks.length === 0) {
  throw new Error("tasks.json must contain at least one task.");
}

const ids = new Set();
const featureNames = new Set();
const manifestTasks = [];

for (const task of taskPlan.tasks) {
  const { id, featureName } = task;

  if (typeof id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error(`Invalid task id: ${String(id)}`);
  }

  if (typeof featureName !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(featureName)) {
    throw new Error(`Invalid feature name for task ${id}.`);
  }

  if (ids.has(id) || featureNames.has(featureName)) {
    throw new Error(`Duplicate task id or feature name: ${id}`);
  }

  ids.add(id);
  featureNames.add(featureName);

  const worktreePath = resolve(repoRoot, ".worktrees", featureName);
  manifestTasks.push({
    id,
    featureName,
    gitBranch: `feature/${featureName}`,
    neonBranch: `feature/${featureName}`,
    worktreePath,
  });

  if (!dryRun) {
    console.log(`\nPreparing ${id}...`);
    execFileSync("pnpm", ["feature:new", featureName, baseRef], {
      cwd: repoRoot,
      stdio: "inherit",
    });
  }
}

const manifest = {
  repoRoot,
  baseRef,
  dryRun,
  tasks: manifestTasks,
};

console.log(`\nTASK_FLEET_MANIFEST=${JSON.stringify(manifest)}`);
