#!/bin/bash

# Simple script to create GitHub repository ruleset
# Usage: bash scripts/create_ruleset_simple.sh

set -e

# Default values
OWNER="Worldbuilding"
REPO="english-to-libran-text-to-voice"
APPROVALS=1
CHECKS="test,lint,type-check,build,security"

echo "Creating repository ruleset for $OWNER/$REPO..."

# Create the ruleset
gh api repos/$OWNER/$REPO/rulesets \
  --method POST \
  --field name="Main Branch Protection" \
  --field target="branch" \
  --field enforcement="active" \
  --field conditions='{"ref_name":{"include":["main"],"exclude":[]}}' \
  --field rules='[
    {"type":"pull_request"},
    {"type":"required_pull_request_reviews","parameters":{"required_approving_review_count":1,"require_code_owner_review":false,"dismiss_stale_reviews_on_push":true}},
    {"type":"required_status_checks","parameters":{"required_status_checks":[{"context":"test","integration_id":null},{"context":"lint","integration_id":null},{"context":"type-check","integration_id":null},{"context":"build","integration_id":null},{"context":"security","integration_id":null}],"strict_required_status_checks_policy":true}},
    {"type":"non_fast_forward"}
  ]'

echo "✅ Repository ruleset created successfully!"
echo "🔒 Main branch is now protected with:"
echo "   - Pull request requirement"
echo "   - Required reviews ($APPROVALS approval(s))"
echo "   - Required status checks: $CHECKS"
echo "   - No force pushes"
