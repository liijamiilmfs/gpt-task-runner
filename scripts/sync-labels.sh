#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required" >&2
  exit 1
fi

repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Syncing labels for $repo"

gh label import -f .github/labels.yml --repo "$repo"
echo "Labels synced."
