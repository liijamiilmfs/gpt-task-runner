# Branch Protection Setup

This document explains how to set up branch protection for both `main` and `dev` branches.

## Prerequisites

1. **Install GitHub CLI** (if not already installed):
   ```bash
   # Windows (using winget)
   winget install GitHub.cli
   
   # Or download from: https://cli.github.com/
   ```

2. **Authenticate with GitHub**:
   ```bash
   gh auth login
   ```

## Automated Setup

### Protect Main Branch
```bash
bash scripts/protect_main_ruleset.sh \
  --owner "your-github-username" \
  --repo "english-to-libran-text-to-voice" \
  --you-actor "your-github-username" \
  --codex-actor "your-codex-username" \
  --checks "test,lint,type-check,build,security"
```

### Protect Dev Branch
```bash
bash scripts/protect_dev_ruleset.sh \
  --owner "your-github-username" \
  --repo "english-to-libran-text-to-voice" \
  --checks "test,lint,type-check,build,security"
```

## Manual Setup (Alternative)

If you prefer to set up protection manually through the GitHub web interface:

### 1. Go to Repository Settings
- Navigate to: `https://github.com/your-username/english-to-libran-text-to-voice/settings/rules`

### 2. Create Ruleset for Main Branch
- Click "New ruleset"
- Name: "Protect main (PR + 2 approvals + checks)"
- Target: "Branch"
- Branch name pattern: `main`
- Add rules:
  - ✅ Require pull request before merging
  - ✅ Require status checks to pass before merging
    - Required checks: `test`, `lint`, `type-check`, `build`, `security`
    - ✅ Require branches to be up to date before merging
  - ✅ Restrict pushes that create files larger than 100 MB
  - ✅ Require linear history
  - ✅ Require signed commits
  - ✅ Require conversation resolution before merging
  - ✅ Require 2 reviews before merging
  - ✅ Dismiss stale reviews when new commits are pushed
  - ✅ Require review from code owners

### 3. Create Ruleset for Dev Branch
- Click "New ruleset"
- Name: "Protect dev (required checks + no force push)"
- Target: "Branch"
- Branch name pattern: `dev`
- Add rules:
  - ✅ Require status checks to pass before merging
    - Required checks: `test`, `lint`, `type-check`, `build`, `security`
    - ✅ Require branches to be up to date before merging
  - ✅ Restrict pushes that create files larger than 100 MB
  - ✅ Require linear history
  - ✅ Require signed commits
  - ✅ Require conversation resolution before merging

## What This Protects Against

### Main Branch:
- ❌ Direct pushes (must use PRs)
- ❌ Merging without 2 approvals
- ❌ Merging with failing tests
- ❌ Force pushes
- ❌ Large files (>100MB)
- ❌ Non-linear history
- ❌ Unsigned commits

### Dev Branch:
- ❌ Pushes with failing tests
- ❌ Force pushes
- ❌ Large files (>100MB)
- ❌ Non-linear history
- ❌ Unsigned commits

## Verification

After setup, verify the protection is working:

1. **Check rulesets**: Visit `https://github.com/your-username/english-to-libran-text-to-voice/settings/rules`
2. **Test protection**: Try to push directly to `main` or `dev` - it should be blocked
3. **Test PR workflow**: Create a PR and ensure it requires checks to pass

## Required Status Checks

The following checks must pass before any push to `dev` or merge to `main`:

- `test` - All unit and integration tests
- `lint` - Code linting (ESLint)
- `type-check` - TypeScript type checking
- `build` - Application build
- `security` - Security audit (npm audit)

These checks are defined in `.github/workflows/ci.yml` and run automatically on every push and PR.
