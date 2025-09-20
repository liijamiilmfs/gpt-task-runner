#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/protect_dev_ruleset.sh --owner YOUR_ORG_OR_USER --repo libran-voice \
#     --checks "test,lint,type-check,build,security" \
#     [--dry-run]
#
# Notes:
# - Requires GitHub CLI (gh) and auth: gh auth login
# - Protects dev branch with required status checks and no force pushes

OWNER=""
REPO=""
DRY_RUN=false
REQUIRED_CHECKS="test,lint,type-check,build,security"
RULESET_NAME="Protect dev (required checks + no force push)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --owner) OWNER="$2"; shift 2;;
    --repo) REPO="$2"; shift 2;;
    --checks) REQUIRED_CHECKS="$2"; shift 2;;
    --ruleset-name) RULESET_NAME="$2"; shift 2;;
    --dry-run) DRY_RUN=true; shift 1;;
    *) echo "Unknown arg: $1"; exit 1;;
  esac
done

[[ -z "$OWNER" || -z "$REPO" ]] && { echo "Missing --owner/--repo"; exit 1; }

command -v gh >/dev/null || { echo "gh not found. Install GitHub CLI."; exit 1; }
gh auth status >/dev/null || { echo "Not authenticated. Run: gh auth login"; exit 1; }

# Look up repo id
REPO_ID=$(gh api "repos/$OWNER/$REPO" --jq '.node_id')

# Try to fetch existing rulesets
EXIST_JSON=$(gh api "repos/$OWNER/$REPO/rulesets" || echo "[]")
RULESET_ID=$(echo "$EXIST_JSON" | jq -r --arg n "$RULESET_NAME" '.[] | select(.name==$n) | .id' | head -n1)

IFS=',' read -r -a CHECKS_ARR <<< "$REQUIRED_CHECKS"

# Build required status checks entries
REQ_CHECKS_JSON=$(printf '%s\n' "${CHECKS_ARR[@]}" | jq -R '{context: .}' | jq -s '{required_status_checks: .}')

# Ruleset payload (GitHub Repository Rules)
PAYLOAD=$(jq -n \
  --arg name "$RULESET_NAME" \
  --argjson checks "$REQ_CHECKS_JSON" \
  --arg repo_id "$REPO_ID" '
{
  "name": $name,
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],

  "conditions": {
    "ref_name": {
      "exclude": [],
      "include": ["refs/heads/dev"]
    }
  },

  "rules": [
    # Required status checks
    {
      "type": "required_status_checks",
      "parameters": {
        "required_status_checks": $checks.required_status_checks,
        "strict_required_status_checks_policy": true
      }
    },

    # No force pushes
    { "type": "non_fast_forward" }
  ]
}')

if [[ -n "$RULESET_ID" ]]; then
  echo "Updating existing ruleset ($RULESET_ID) on $OWNER/$REPO for dev branch"
  if $DRY_RUN; then
    echo "[DRY-RUN] gh api repos/$OWNER/$REPO/rulesets/$RULESET_ID -X PATCH -f <payload>"
    echo "$PAYLOAD" | jq .
  else
    gh api "repos/$OWNER/$REPO/rulesets/$RULESET_ID" -X PATCH \
      -H "Accept: application/vnd.github+json" \
      --input - <<< "$PAYLOAD" >/dev/null
  fi
else
  echo "Creating new ruleset on $OWNER/$REPO for dev branch"
  if $DRY_RUN; then
    echo "[DRY-RUN] gh api repos/$OWNER/$REPO/rulesets -X POST -f <payload>"
    echo "$PAYLOAD" | jq .
  else
    gh api "repos/$OWNER/$REPO/rulesets" -X POST \
      -H "Accept: application/vnd.github+json" \
      --input - <<< "$PAYLOAD" >/dev/null
  fi
fi

echo "Done. Verify at: https://github.com/$OWNER/$REPO/settings/rules"
