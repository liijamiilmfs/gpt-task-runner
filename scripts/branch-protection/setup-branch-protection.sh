#!/bin/bash

# Branch Protection Setup Script for Bash
# 
# This script automatically configures branch protection rules for the repository
# using the GitHub CLI. It sets up protection for both main and dev branches.
# 
# Prerequisites:
# - GitHub CLI (gh) must be installed and authenticated
# - Repository must be accessible via GitHub CLI
# - User must have admin permissions on the repository

set -e

# Configuration
BRANCHES=("main" "dev")
REQUIRED_STATUS_CHECKS=("ci/tests" "ci/lint" "ci/type-check" "ci/build" "ci/security" "ci/coverage")
REQUIRED_APPROVALS=1
DISMISS_STALE_REVIEWS=true
REQUIRE_CODE_OWNER_REVIEWS=true
REQUIRE_UP_TO_DATE_BRANCHES=true
ENFORCE_ADMINS=true
ALLOW_FORCE_PUSHES=false
ALLOW_DELETIONS=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
    
    case $level in
        "INFO")
            echo -e "${BLUE}[${timestamp}] [INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[${timestamp}] [SUCCESS]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[${timestamp}] [WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[${timestamp}] [ERROR]${NC} $message"
            ;;
    esac
}

# Get repository name
get_repository_name() {
    if [ -n "$GITHUB_REPOSITORY" ]; then
        echo "$GITHUB_REPOSITORY"
        return
    fi
    
    if ! gh repo view --json nameWithOwner >/dev/null 2>&1; then
        log "ERROR" "Failed to get repository name. Make sure you are in a git repository with GitHub remote."
        log "ERROR" "You can also set the GITHUB_REPOSITORY environment variable."
        exit 1
    fi
    
    gh repo view --json nameWithOwner | jq -r '.nameWithOwner'
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check if GitHub CLI is installed
    if ! command -v gh &> /dev/null; then
        log "ERROR" "GitHub CLI is not installed. Please install it first."
        log "ERROR" "Visit: https://cli.github.com/"
        exit 1
    fi
    log "SUCCESS" "GitHub CLI is installed"
    
    # Check if user is authenticated
    if ! gh auth status >/dev/null 2>&1; then
        log "ERROR" "GitHub CLI is not authenticated. Please run: gh auth login"
        exit 1
    fi
    log "SUCCESS" "GitHub CLI is authenticated"
    
    # Check repository access
    if ! gh repo view "$REPOSITORY" >/dev/null 2>&1; then
        log "ERROR" "Cannot access repository: $REPOSITORY"
        log "ERROR" "Make sure you have admin permissions on this repository."
        exit 1
    fi
    log "SUCCESS" "Repository access confirmed: $REPOSITORY"
}

# Create branch protection rule
create_branch_protection_rule() {
    local branch=$1
    log "INFO" "Setting up branch protection for: $branch"
    
    # Build status checks array
    local status_checks_json="["
    for i in "${!REQUIRED_STATUS_CHECKS[@]}"; do
        if [ $i -gt 0 ]; then
            status_checks_json+=","
        fi
        status_checks_json+="\"${REQUIRED_STATUS_CHECKS[$i]}\""
    done
    status_checks_json+="]"
    
    # Create the rule configuration
    local rule_config=$(cat <<EOF
{
  "required_status_checks": {
    "strict": $REQUIRE_UP_TO_DATE_BRANCHES,
    "contexts": $status_checks_json
  },
  "enforce_admins": $ENFORCE_ADMINS,
  "required_pull_request_reviews": {
    "required_approving_review_count": $REQUIRED_APPROVALS,
    "dismiss_stale_reviews": $DISMISS_STALE_REVIEWS,
    "require_code_owner_reviews": $REQUIRE_CODE_OWNER_REVIEWS
  },
  "restrictions": null,
  "allow_force_pushes": $ALLOW_FORCE_PUSHES,
  "allow_deletions": $ALLOW_DELETIONS
}
EOF
)
    
    # Apply the branch protection rule
    if gh api "repos/$REPOSITORY/branches/$branch/protection" \
        --method PUT \
        --field "required_status_checks=$(echo "$rule_config" | jq -c '.required_status_checks')" \
        --field "enforce_admins=$ENFORCE_ADMINS" \
        --field "required_pull_request_reviews=$(echo "$rule_config" | jq -c '.required_pull_request_reviews')" \
        --field "restrictions=null" \
        --field "allow_force_pushes=$ALLOW_FORCE_PUSHES" \
        --field "allow_deletions=$ALLOW_DELETIONS" >/dev/null 2>&1; then
        log "SUCCESS" "Branch protection configured for: $branch"
    else
        log "ERROR" "Failed to configure branch protection for: $branch"
        exit 1
    fi
}

# Create CODEOWNERS file
create_code_owners_file() {
    log "INFO" "Creating CODEOWNERS file..."
    
    local current_user=$(gh api user | jq -r '.login')
    if [ "$current_user" = "null" ] || [ -z "$current_user" ]; then
        log "WARN" "Failed to get current user. Using fallback."
        current_user="username"
    fi
    
    local code_owners_content="# Global code owners
* @$current_user

# Core functionality
/src/ @$current_user
/tests/ @$current_user

# Dashboard
/dashboard/ @$current_user

# Documentation
/docs/ @$current_user
*.md @$current_user

# Configuration files
package.json @$current_user
tsconfig.json @$current_user
.github/ @$current_user
"
    
    # Create .github directory if it doesn't exist
    mkdir -p .github
    
    echo "$code_owners_content" > .github/CODEOWNERS
    log "SUCCESS" "CODEOWNERS file created"
}

# Verify branch protection
verify_branch_protection() {
    local branch=$1
    log "INFO" "Verifying branch protection for: $branch"
    
    if gh api "repos/$REPOSITORY/branches/$branch/protection" >/dev/null 2>&1; then
        log "SUCCESS" "Branch protection verified for: $branch"
        return 0
    else
        log "ERROR" "Branch protection verification failed for: $branch"
        return 1
    fi
}

# Main execution
main() {
    log "INFO" "Starting branch protection setup..."
    
    REPOSITORY=$(get_repository_name)
    log "INFO" "Repository: $REPOSITORY"
    
    check_prerequisites
    
    # Create CODEOWNERS file
    create_code_owners_file
    
    # Set up protection for each branch
    for branch in "${BRANCHES[@]}"; do
        create_branch_protection_rule "$branch"
        verify_branch_protection "$branch"
    done
    
    log "SUCCESS" "Branch protection setup completed successfully!"
    echo ""
    log "INFO" "Next steps:"
    log "INFO" "1. Set up GitHub Actions workflows for status checks"
    log "INFO" "2. Review and update CODEOWNERS file"
    log "INFO" "3. Test the protection rules with a test PR"
    log "INFO" "4. Configure security scanning tools (Snyk, etc.)"
}

# Check for help flag
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "Branch Protection Setup Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h     Show this help message"
    echo "  --verbose, -v  Enable verbose output"
    echo ""
    echo "Environment Variables:"
    echo "  GITHUB_REPOSITORY  Override repository name (format: owner/repo)"
    echo ""
    echo "Prerequisites:"
    echo "  - GitHub CLI (gh) must be installed and authenticated"
    echo "  - Repository must be accessible via GitHub CLI"
    echo "  - User must have admin permissions on the repository"
    exit 0
fi

# Check for verbose flag
if [[ "$1" == "--verbose" ]] || [[ "$1" == "-v" ]]; then
    set -x
fi

# Run main function
main
