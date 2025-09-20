#!/usr/bin/env bash
set -euo pipefail

# Script to add existing issues to GitHub project
# Usage: bash scripts/add_issues_to_project.sh --owner OWNER --repo REPO --project-id PROJECT_ID

OWNER=""
REPO=""
PROJECT_ID="PVT_kwHODelUvc4BDmZV"  # Your project ID
DRY_RUN=false

while [ "$#" -gt 0 ]; do
  case "$1" in
    --owner) OWNER="$2"; shift 2;;
    --repo) REPO="$2"; shift 2;;
    --project-id) PROJECT_ID="$2"; shift 2;;
    --dry-run) DRY_RUN=true; shift 1;;
    *) echo "Unknown option: $1"; exit 1;;
  esac
done

if [ -z "$OWNER" ] || [ -z "$REPO" ]; then
  echo "Error: --owner and --repo are required." >&2
  exit 1
fi

echo "Adding issues #10-#36 to project $PROJECT_ID..."

# Function to add an issue to the project
add_issue_to_project() {
  local issue_number="$1"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY-RUN] Would add issue #$issue_number to project"
    return
  fi
  
  echo "Adding issue #$issue_number to project..."
  
  # Get the issue node ID
  local issue_node_id
  issue_node_id=$(gh api graphql -f query="query(\$owner: String!, \$repo: String!, \$number: Int!) { repository(owner: \$owner, name: \$repo) { issue(number: \$number) { id } } }" \
    --raw-field owner="$OWNER" \
    --raw-field repo="$REPO" \
    --raw-field number="$issue_number" \
    --jq '.data.repository.issue.id')
  
  if [ -n "$issue_node_id" ] && [ "$issue_node_id" != "null" ]; then
    # Add to project
    gh api graphql -f query="mutation(\$projectId: ID!, \$contentId: ID!) { addProjectV2ItemById(input: {projectId: \$projectId, contentId: \$contentId}) { item { id } } }" \
      --raw-field projectId="$PROJECT_ID" \
      --raw-field contentId="$issue_node_id" >/dev/null
    echo "✅ Added issue #$issue_number to project"
  else
    echo "❌ Could not get node ID for issue #$issue_number"
  fi
}

# Add issues #10-#36 to the project
for issue_num in {10..36}; do
  add_issue_to_project "$issue_num"
done

echo "Done! All issues should now be visible in your project board."
