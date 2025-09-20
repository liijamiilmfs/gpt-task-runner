#!/usr/bin/env bash
set -euo pipefail

# Simple GitHub Project creation script
# Usage: bash scripts/simple_github_project.sh --owner OWNER --repo REPO

OWNER=""
REPO=""
PROJECT_NAME="Librán Voice Forge"
VISIBILITY="PRIVATE"
DRY_RUN=false

while [ "$#" -gt 0 ]; do
  case "$1" in
    --owner) OWNER="$2"; shift 2;;
    --repo) REPO="$2"; shift 2;;
    --project-name) PROJECT_NAME="$2"; shift 2;;
    --visibility) VISIBILITY="$2"; shift 2;;
    --dry-run) DRY_RUN=true; shift 1;;
    *) echo "Unknown option: $1"; exit 1;;
  esac
done

if [ -z "$OWNER" ] || [ -z "$REPO" ]; then
  echo "Error: --owner and --repo are required." >&2
  exit 1
fi

# Check if GitHub CLI is available
if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) not found. Please install it first." >&2
  exit 1
fi

# Check authentication
if ! gh auth status >/dev/null 2>&1; then
  echo "Error: Not authenticated. Run 'gh auth login' first." >&2
  exit 1
fi

echo "Creating GitHub project for $OWNER/$REPO..."

# Get owner node ID
echo "Getting owner information..."
OWNER_RESPONSE=$(gh api "users/$OWNER" 2>/dev/null || gh api "orgs/$OWNER" 2>/dev/null || echo "{}")
OWNER_ID=$(echo "$OWNER_RESPONSE" | jq -r '.node_id // empty')

if [ -z "$OWNER_ID" ] || [ "$OWNER_ID" = "null" ]; then
  echo "Error: Could not get owner ID for $OWNER" >&2
  exit 1
fi

echo "Owner ID: $OWNER_ID"

# Create project using the new GitHub CLI project commands
if [ "$DRY_RUN" = true ]; then
  echo "[DRY-RUN] Would create project '$PROJECT_NAME'"
  echo "[DRY-RUN] Owner: $OWNER"
  echo "[DRY-RUN] Visibility: $VISIBILITY"
else
  echo "Creating project using GitHub CLI..."
  
  # Check if project already exists
  echo "Checking for existing projects..."
  if gh project list --owner "$OWNER" --format json | jq -e --arg title "$PROJECT_NAME" '.projects[] | select(.title == $title)' >/dev/null 2>&1; then
    echo "Project '$PROJECT_NAME' already exists!"
    PROJECT_URL=$(gh project list --owner "$OWNER" --format json | jq -r --arg title "$PROJECT_NAME" '.projects[] | select(.title == $title) | .url')
    echo "Project URL: $PROJECT_URL"
  else
    echo "Creating new project..."
    # Create the project
    PROJECT_URL=$(gh project create --owner "$OWNER" --title "$PROJECT_NAME")
    echo "Project created successfully!"
    echo "Project URL: $PROJECT_URL"
  fi
fi

echo "Done!"
