# Branch Protection Setup Script for PowerShell
# 
# This script automatically configures branch protection rules for the repository
# using the GitHub CLI. It sets up protection for both main and dev branches.
# 
# Prerequisites:
# - GitHub CLI (gh) must be installed and authenticated
# - Repository must be accessible via GitHub CLI
# - User must have admin permissions on the repository

param(
    [switch]$Verbose,
    [string]$Repository = "",
    [string[]]$Branches = @("main", "dev")
)

# Configuration
$Config = @{
    RequiredStatusChecks = @(
        "ci/tests",
        "ci/lint", 
        "ci/type-check",
        "ci/build",
        "ci/security",
        "ci/coverage"
    )
    RequiredApprovals = 1
    DismissStaleReviews = $true
    RequireCodeOwnerReviews = $true
    RequireUpToDateBranches = $true
    EnforceAdmins = $true
    AllowForcePushes = $false
    AllowDeletions = $false
}

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "Info"
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
    $Prefix = "[$Timestamp] [$($Level.ToUpper())]"
    Write-Host "$Prefix $Message"
}

function Get-RepositoryName {
    if ($Repository) {
        return $Repository
    }
    
    try {
        $result = gh repo view --json nameWithOwner | ConvertFrom-Json
        return $result.nameWithOwner
    }
    catch {
        Write-Log "Failed to get repository name. Make sure you are in a git repository with GitHub remote." "Error"
        Write-Log "You can also use the -Repository parameter to specify the repository." "Error"
        exit 1
    }
}

function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check if GitHub CLI is installed
    try {
        gh --version | Out-Null
        Write-Log "✓ GitHub CLI is installed"
    }
    catch {
        Write-Log "✗ GitHub CLI is not installed. Please install it first." "Error"
        Write-Log "Visit: https://cli.github.com/" "Error"
        exit 1
    }

    # Check if user is authenticated
    try {
        gh auth status | Out-Null
        Write-Log "✓ GitHub CLI is authenticated"
    }
    catch {
        Write-Log "✗ GitHub CLI is not authenticated. Please run: gh auth login" "Error"
        exit 1
    }

    # Check repository access
    try {
        gh repo view $RepositoryName | Out-Null
        Write-Log "✓ Repository access confirmed: $RepositoryName"
    }
    catch {
        Write-Log "✗ Cannot access repository: $RepositoryName" "Error"
        Write-Log "Make sure you have admin permissions on this repository." "Error"
        exit 1
    }
}

function New-BranchProtectionRule {
    param([string]$Branch)
    
    Write-Log "Setting up branch protection for: $Branch"
    
    $ruleConfig = @{
        required_status_checks = @{
            strict = $Config.RequireUpToDateBranches
            contexts = $Config.RequiredStatusChecks
        }
        enforce_admins = $Config.EnforceAdmins
        required_pull_request_reviews = @{
            required_approving_review_count = $Config.RequiredApprovals
            dismiss_stale_reviews = $Config.DismissStaleReviews
            require_code_owner_reviews = $Config.RequireCodeOwnerReviews
        }
        restrictions = $null
        allow_force_pushes = $Config.AllowForcePushes
        allow_deletions = $Config.AllowDeletions
    }

    try {
        $statusChecksJson = $ruleConfig.required_status_checks | ConvertTo-Json -Compress
        $reviewsJson = $ruleConfig.required_pull_request_reviews | ConvertTo-Json -Compress
        
        $command = "gh api repos/$RepositoryName/branches/$Branch/protection --method PUT " +
                  "--field required_status_checks='$statusChecksJson' " +
                  "--field enforce_admins=$($ruleConfig.enforce_admins) " +
                  "--field required_pull_request_reviews='$reviewsJson' " +
                  "--field restrictions=null " +
                  "--field allow_force_pushes=$($ruleConfig.allow_force_pushes) " +
                  "--field allow_deletions=$($ruleConfig.allow_deletions)"

        if ($Verbose) {
            Write-Log "Executing: $command"
        }

        Invoke-Expression $command | Out-Null
        Write-Log "✓ Branch protection configured for: $Branch"
    }
    catch {
        Write-Log "✗ Failed to configure branch protection for: $Branch" "Error"
        if ($Verbose) {
            Write-Log "Error details: $($_.Exception.Message)" "Error"
        }
        throw
    }
}

function New-CodeOwnersFile {
    Write-Log "Creating CODEOWNERS file..."
    
    $currentUser = Get-CurrentUser
    $codeOwnersContent = @"
# Global code owners
* @$currentUser

# Core functionality
/src/ @$currentUser
/tests/ @$currentUser

# Dashboard
/dashboard/ @$currentUser

# Documentation
/docs/ @$currentUser
*.md @$currentUser

# Configuration files
package.json @$currentUser
tsconfig.json @$currentUser
.github/ @$currentUser
"@

    $codeOwnersPath = Join-Path $PWD ".github\CODEOWNERS"
    
    # Create .github directory if it doesn't exist
    $githubDir = Split-Path $codeOwnersPath -Parent
    if (!(Test-Path $githubDir)) {
        New-Item -ItemType Directory -Path $githubDir -Force | Out-Null
    }

    Set-Content -Path $codeOwnersPath -Value $codeOwnersContent
    Write-Log "✓ CODEOWNERS file created"
}

function Get-CurrentUser {
    try {
        $result = gh api user | ConvertFrom-Json
        return $result.login
    }
    catch {
        Write-Log "Failed to get current user. Using fallback." "Warn"
        return "username" # Fallback
    }
}

function Test-BranchProtection {
    param([string]$Branch)
    
    Write-Log "Verifying branch protection for: $Branch"
    
    try {
        $result = gh api repos/$RepositoryName/branches/$Branch/protection | ConvertFrom-Json
        Write-Log "✓ Branch protection verified for: $Branch"
        
        if ($Verbose) {
            Write-Log "Protection details: $($result | ConvertTo-Json -Depth 10)"
        }
        
        return $true
    }
    catch {
        Write-Log "✗ Branch protection verification failed for: $Branch" "Error"
        return $false
    }
}

# Main execution
try {
    Write-Log "Starting branch protection setup..."
    
    $RepositoryName = Get-RepositoryName
    Write-Log "Repository: $RepositoryName"
    
    Test-Prerequisites
    
    # Create CODEOWNERS file
    New-CodeOwnersFile
    
    # Set up protection for each branch
    foreach ($branch in $Branches) {
        New-BranchProtectionRule -Branch $branch
        Test-BranchProtection -Branch $branch
    }
    
    Write-Log "✓ Branch protection setup completed successfully!"
    Write-Log ""
    Write-Log "Next steps:"
    Write-Log "1. Set up GitHub Actions workflows for status checks"
    Write-Log "2. Review and update CODEOWNERS file"
    Write-Log "3. Test the protection rules with a test PR"
    Write-Log "4. Configure security scanning tools (Snyk, etc.)"
}
catch {
    Write-Log "Branch protection setup failed!" "Error"
    if ($Verbose) {
        Write-Log "Error details: $($_.Exception.Message)" "Error"
    }
    exit 1
}
