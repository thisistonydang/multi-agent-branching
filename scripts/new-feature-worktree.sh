#!/usr/bin/env bash

set -Eeuo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/new-feature-worktree.sh <feature-name> [base-ref]

Creates matching development environments for a feature:
  Git branch:   feature/<normalized-feature-name>
  Worktree:     .worktrees/<normalized-feature-name>
  Neon branch:  feature/<normalized-feature-name>

The base ref defaults to HEAD.

Example:
  scripts/new-feature-worktree.sh "Add login" main
EOF
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 || $# -gt 2 ]]; then
  usage >&2
  exit 2
fi

feature_name=$1
base_ref=${2:-HEAD}

slug=$(
  printf '%s' "$feature_name" |
    tr '[:upper:]_' '[:lower:]-' |
    sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
)

if [[ -z $slug ]]; then
  echo "Error: feature name must contain at least one letter or number." >&2
  exit 2
fi

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "Error: run this script from inside a Git repository." >&2
  exit 1
}

context_file="$repo_root/.neon"
if [[ ! -f $context_file ]]; then
  echo "Error: $context_file does not exist. Run 'neon link' in the repository first." >&2
  exit 1
fi

if ! command -v neon >/dev/null 2>&1; then
  echo "Error: Neon CLI is not installed. Install it with 'npm install --global neon'." >&2
  exit 1
fi

project_id=$(node - "$context_file" <<'NODE'
const fs = require("node:fs");
const context = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
if (typeof context.projectId !== "string" || context.projectId.length === 0) {
  process.exit(1);
}
process.stdout.write(context.projectId);
NODE
) || {
  echo "Error: $context_file does not contain a valid Neon project ID." >&2
  exit 1
}

git_branch="feature/$slug"
neon_branch=$git_branch
worktree_path="$repo_root/.worktrees/$slug"

if ! git check-ref-format --branch "$git_branch" >/dev/null 2>&1; then
  echo "Error: generated branch name '$git_branch' is not valid." >&2
  exit 1
fi

if ! git -C "$repo_root" rev-parse --verify "${base_ref}^{commit}" >/dev/null 2>&1; then
  echo "Error: base ref '$base_ref' does not identify a commit." >&2
  exit 1
fi

if git -C "$repo_root" show-ref --verify --quiet "refs/heads/$git_branch"; then
  echo "Error: Git branch '$git_branch' already exists." >&2
  exit 1
fi

if [[ -e $worktree_path ]]; then
  echo "Error: worktree path '$worktree_path' already exists." >&2
  exit 1
fi

mkdir -p "$repo_root/.worktrees"
created_worktree=false

cleanup_on_failure() {
  status=$?
  if [[ $status -ne 0 && $created_worktree == true ]]; then
    echo "Creation failed. Removing the new Git worktree and branch." >&2
    git -C "$repo_root" worktree remove --force "$worktree_path" >/dev/null 2>&1 || true
    git -C "$repo_root" branch -D "$git_branch" >/dev/null 2>&1 || true
  fi
  exit "$status"
}
trap cleanup_on_failure EXIT

echo "Creating Git branch '$git_branch' and worktree '$worktree_path'..."
git -C "$repo_root" worktree add -b "$git_branch" "$worktree_path" "$base_ref"
created_worktree=true

echo "Creating and checking out Neon branch '$neon_branch'..."
(
  cd "$worktree_path"
  neon checkout "$neon_branch" --create --project-id "$project_id"
)

trap - EXIT

cat <<EOF

Feature environment created successfully.
Git branch:  $git_branch
Neon branch: $neon_branch
Worktree:    $worktree_path

Open it with:
  cd "$worktree_path"
EOF
