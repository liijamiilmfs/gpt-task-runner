#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required" >&2
  exit 1
fi

repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)

create_issue_if_absent() {
  local title="$1"; shift
  local body="$1"; shift
  local labels="$1"; shift
  local milestone_title="$1"; shift

  # Resolve milestone number if exists
  local milestone_number
  milestone_number=$(gh api repos/$repo/milestones --paginate -q \
    ".[] | select(.title==\"${milestone_title}\") | .number" || true)

  if gh issue list --repo "$repo" --state all --json title -q \
    ".[] | select(.title==\"${title}\") | .title" | grep -q .; then
    echo "Issue exists: $title"
    return 0
  fi

  echo "Creating issue: $title"
  if [ -n "$milestone_number" ]; then
    gh issue create --repo "$repo" --title "$title" --body "$body" --label "$labels" --milestone "$milestone_number" >/dev/null || echo "Warning: failed to create $title"
  else
    gh issue create --repo "$repo" --title "$title" --body "$body" --label "$labels" >/dev/null || echo "Warning: failed to create $title"
  fi
}

create_issue_if_absent \
  "epic(toptier): M1 Governance & CI foundations" \
  "Tracking epic for M1 per docs/milestones.md." \
  "toptier,docs" \
  "M1: Governance & CI foundations"

create_issue_if_absent \
  "chore(toptier): Establish label taxonomy and templates" \
  "Add labels.yml, PR/issue templates; see docs/governance.md" \
  "toptier,chore,docs" \
  "M1: Governance & CI foundations"

create_issue_if_absent \
  "chore(toptier): Enforce CI quality gates" \
  "Ensure lint, type, test, security jobs required on PRs" \
  "toptier,ci-cd" \
  "M1: Governance & CI foundations"

create_issue_if_absent \
  "epic(toptier): M2 Quality gates & testing" \
  "Tracking epic for M2 per docs/milestones.md." \
  "toptier,testing" \
  "M2: Quality gates & testing"

create_issue_if_absent \
  "chore(toptier): Coverage thresholds and flake control" \
  "Define coverage minimums and stabilize tests" \
  "toptier,testing" \
  "M2: Quality gates & testing"

echo "TopTier issues creation attempted."
