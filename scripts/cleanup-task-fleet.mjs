#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, sep } from "node:path";

const cliArgs = new Set(process.argv.slice(2));

if (cliArgs.has("--help") || cliArgs.has("-h")) {
  console.log(`Usage: pnpm fleet:clean --yes [--force]\n       pnpm fleet:clean --dry-run\n\nRemoves task-fleet Git worktrees, local Git branches, and matching Neon branches.\n\nOptions:\n  --dry-run  Show what would be removed.\n  --yes      Confirm permanent deletion.\n  --force    Remove dirty worktrees. Requires --yes.`);
  process.exit(0);
}

const supportedArgs = new Set(["--dry-run", "--yes", "--force"]);
for (const arg of cliArgs) {
  if (!supportedArgs.has(arg)) {
    console.error(`Unknown argument: ${arg}`);
    process.exit(2);
  }
}

const dryRun = cliArgs.has("--dry-run");
const confirmed = cliArgs.has("--yes");
const force = cliArgs.has("--force");

if (!dryRun && !confirmed) {
  console.error("Cleanup permanently deletes worktrees, local Git branches, and matching Neon branches.");
  console.error("Run 'pnpm fleet:clean --dry-run' first, then run 'pnpm fleet:clean --yes'.");
  process.exit(2);
}

const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
  });

const repoRoot = run("git", ["rev-parse", "--show-toplevel"]).trim();
const worktreeRoot = resolve(repoRoot, ".worktrees");
const contextPath = resolve(repoRoot, ".neon");
const taskPlan = JSON.parse(readFileSync(resolve(repoRoot, "tasks.json"), "utf8"));
const neonContext = JSON.parse(readFileSync(contextPath, "utf8"));
const projectId = neonContext.projectId;

if (typeof projectId !== "string" || projectId.length === 0) {
  throw new Error(`${contextPath} does not contain a valid Neon project ID.`);
}

const targets = new Map();

for (const task of taskPlan.tasks ?? []) {
  if (typeof task.featureName !== "string" || task.featureName.length === 0) continue;
  const branch = `feature/${task.featureName}`;
  targets.set(branch, {
    branch,
    worktreePath: resolve(worktreeRoot, task.featureName),
  });
}

const worktreeOutput = run("git", ["worktree", "list", "--porcelain"], { cwd: repoRoot });
for (const record of worktreeOutput.trim().split(/\n\n+/)) {
  const lines = record.split("\n");
  const pathLine = lines.find((line) => line.startsWith("worktree "));
  const branchLine = lines.find((line) => line.startsWith("branch refs/heads/"));
  if (!pathLine || !branchLine) continue;

  const worktreePath = pathLine.slice("worktree ".length);
  const branch = branchLine.slice("branch refs/heads/".length);
  if (worktreePath.startsWith(`${worktreeRoot}${sep}`)) {
    targets.set(branch, { branch, worktreePath });
  }
}

for (const target of targets.values()) {
  if (["main", "master", "production"].includes(target.branch)) {
    throw new Error(`Refusing to delete protected branch '${target.branch}'.`);
  }
}

const existingWorktrees = [...targets.values()].filter((target) => existsSync(target.worktreePath));
const dirtyWorktrees = [];
for (const target of existingWorktrees) {
  const status = run("git", ["status", "--porcelain"], { cwd: target.worktreePath }).trim();
  if (status) dirtyWorktrees.push(target);
}

if (dirtyWorktrees.length > 0 && !force) {
  console.error("Refusing to remove worktrees with uncommitted changes:");
  for (const target of dirtyWorktrees) console.error(`  ${target.worktreePath}`);
  console.error("Commit the changes, or rerun with '--yes --force' to discard them.");
  process.exit(1);
}

const branchListRaw = run("neon", ["branches", "list", "--project-id", projectId, "--output", "json"], {
  cwd: repoRoot,
});
const branchListResult = JSON.parse(branchListRaw);
const neonBranches = Array.isArray(branchListResult) ? branchListResult : branchListResult.branches ?? [];
const existingNeonNames = new Set(neonBranches.map((branch) => branch.name));

console.log("Task fleet cleanup plan:");
for (const target of targets.values()) {
  console.log(`  Worktree:    ${existsSync(target.worktreePath) ? target.worktreePath : "not present"}`);
  console.log(`  Git branch:  ${target.branch}`);
  console.log(`  Neon branch: ${existingNeonNames.has(target.branch) ? target.branch : "not present"}`);
}

if (dryRun) {
  console.log("\nDry run complete. Nothing was deleted.");
  process.exit(0);
}

// Keep the repository's Neon context on main before deleting feature branches.
run("neon", ["checkout", "main", "--project-id", projectId, "--no-env-pull"], {
  cwd: repoRoot,
  stdio: "inherit",
});

for (const target of targets.values()) {
  if (existsSync(target.worktreePath)) {
    const args = ["worktree", "remove"];
    if (force) args.push("--force");
    args.push(target.worktreePath);
    run("git", args, { cwd: repoRoot, stdio: "inherit" });
  }
}

run("git", ["worktree", "prune"], { cwd: repoRoot, stdio: "inherit" });

for (const target of targets.values()) {
  try {
    run("git", ["show-ref", "--verify", "--quiet", `refs/heads/${target.branch}`], { cwd: repoRoot });
  } catch {
    continue;
  }
  run("git", ["branch", "-D", target.branch], { cwd: repoRoot, stdio: "inherit" });
}

for (const target of targets.values()) {
  if (!existingNeonNames.has(target.branch)) continue;
  run("neon", ["branches", "delete", target.branch, "--project-id", projectId], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

console.log("\nTask fleet cleanup complete.");
