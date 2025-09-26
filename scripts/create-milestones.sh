#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required" >&2
  exit 1
fi

repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)

declare -A MILESTONES=(
  ["M1: Governance & CI foundations"]="2025-10-03"
  ["M2: Quality gates & testing"]="2025-10-10"
  ["M3: Release process & versioning"]="2025-10-17"
  ["M4: Docs & onboarding"]="2025-10-24"
  ["M5: Observability & dashboards"]="2025-10-31"
)

for title in "${!MILESTONES[@]}"; do
  due_date="${MILESTONES[$title]}"
  if gh api -X GET repos/$repo/milestones --paginate -q '.[] | select(.title=="'$title'") | .number' | grep -qE '^[0-9]+$'; then
    echo "Milestone exists: $title"
  else
    echo "Creating milestone: $title (due $due_date)"
    gh api -X POST repos/$repo/milestones -f title="$title" -f due_on="${due_date}T23:59:59Z" >/dev/null
  fi
done

echo "Milestones ensured."
