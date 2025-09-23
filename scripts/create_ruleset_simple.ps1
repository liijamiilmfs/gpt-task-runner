# Simple script to create GitHub repository ruleset
# Usage: powershell -ExecutionPolicy Bypass -File scripts/create_ruleset_simple.ps1

# Default values
$OWNER = "Worldbuilding"
$REPO = "english-to-libran-text-to-voice"
$APPROVALS = 1
$CHECKS = "test,lint,type-check,build,security"

Write-Host "Creating repository ruleset for $OWNER/$REPO..." -ForegroundColor Green

# Create the ruleset
$ruleset = @{
    name = "Main Branch Protection"
    target = "branch"
    enforcement = "active"
    conditions = @{
        ref_name = @{
            include = @("main")
            exclude = @()
        }
    }
    rules = @(
        @{ type = "pull_request" }
        @{
            type = "required_pull_request_reviews"
            parameters = @{
                required_approving_review_count = 1
                require_code_owner_review = $false
                dismiss_stale_reviews_on_push = $true
            }
        }
        @{
            type = "required_status_checks"
            parameters = @{
                required_status_checks = @(
                    @{ context = "test"; integration_id = $null }
                    @{ context = "lint"; integration_id = $null }
                    @{ context = "type-check"; integration_id = $null }
                    @{ context = "build"; integration_id = $null }
                    @{ context = "security"; integration_id = $null }
                )
                strict_required_status_checks_policy = $true
            }
        }
        @{ type = "non_fast_forward" }
    )
}

# Convert to JSON and create the ruleset
$json = $ruleset | ConvertTo-Json -Depth 10
gh api repos/$OWNER/$REPO/rulesets --method POST --input -

Write-Host "✅ Repository ruleset created successfully!" -ForegroundColor Green
Write-Host "🔒 Main branch is now protected with:" -ForegroundColor Yellow
Write-Host "   - Pull request requirement" -ForegroundColor White
Write-Host "   - Required reviews ($APPROVALS approval(s))" -ForegroundColor White
Write-Host "   - Required status checks: $CHECKS" -ForegroundColor White
Write-Host "   - No force pushes" -ForegroundColor White
