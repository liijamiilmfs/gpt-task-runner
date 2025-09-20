# PowerShell script to set up branch protection
# Run this after installing GitHub CLI: winget install GitHub.cli

param(
    [Parameter(Mandatory=$true)]
    [string]$Owner,
    
    [Parameter(Mandatory=$true)]
    [string]$Repo,
    
    [string]$Checks = "test,lint,type-check,build,security",
    [switch]$DryRun
)

Write-Host "Setting up branch protection for $Owner/$Repo" -ForegroundColor Green

# Check if GitHub CLI is installed
try {
    gh --version | Out-Null
    Write-Host "✅ GitHub CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ GitHub CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   winget install GitHub.cli" -ForegroundColor Yellow
    Write-Host "   Or download from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if authenticated
try {
    gh auth status | Out-Null
    Write-Host "✅ GitHub CLI authenticated" -ForegroundColor Green
} catch {
    Write-Host "❌ Not authenticated. Please run: gh auth login" -ForegroundColor Red
    exit 1
}

# Set up main branch protection
Write-Host "`n🔒 Setting up main branch protection..." -ForegroundColor Cyan
$mainArgs = @(
    "bash", "scripts/protect_main_ruleset.sh",
    "--owner", $Owner,
    "--repo", $Repo,
    "--you-actor", $Owner,
    "--checks", $Checks
)
if ($DryRun) { $mainArgs += "--dry-run" }

try {
    & $mainArgs[0] $mainArgs[1..($mainArgs.Length-1)]
    Write-Host "✅ Main branch protection configured" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set up main branch protection" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

# Set up dev branch protection
Write-Host "`n🔒 Setting up dev branch protection..." -ForegroundColor Cyan
$devArgs = @(
    "bash", "scripts/protect_dev_ruleset.sh",
    "--owner", $Owner,
    "--repo", $Repo,
    "--checks", $Checks
)
if ($DryRun) { $devArgs += "--dry-run" }

try {
    & $devArgs[0] $devArgs[1..($devArgs.Length-1)]
    Write-Host "✅ Dev branch protection configured" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set up dev branch protection" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n🎉 Branch protection setup complete!" -ForegroundColor Green
Write-Host "Verify at: https://github.com/$Owner/$Repo/settings/rules" -ForegroundColor Blue
