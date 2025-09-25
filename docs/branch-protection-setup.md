# Branch Protection Setup Guide

## Prerequisites

- GitHub repository with admin access
- GitHub CLI installed (`gh` command)
- Node.js and npm installed for local scripts

## Automated Setup

### Using GitHub CLI Script

```bash
# Navigate to the scripts directory
cd scripts/branch-protection

# Make the script executable (Linux/Mac)
chmod +x setup-branch-protection.sh

# Run the setup script
./setup-branch-protection.sh

# Or run with Node.js
node setup-branch-protection.js
```

### Using PowerShell (Windows)

```powershell
# Navigate to the scripts directory
cd scripts/branch-protection

# Run the PowerShell script
.\setup-branch-protection.ps1
```

## Manual Setup

### 1. Navigate to Repository Settings

1. Go to your GitHub repository
2. Click on "Settings" tab
3. Click on "Branches" in the left sidebar

### 2. Configure Main Branch Protection

1. Click "Add rule" next to "Branch protection rules"
2. In "Branch name pattern", enter: `main`
3. Configure the following settings:

#### Required Status Checks

- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- Select the following required status checks:
  - `ci/tests` (CI/CD Pipeline tests)
  - `ci/lint` (Linting)
  - `ci/type-check` (Type checking)
  - `ci/build` (Build)
  - `ci/security` (Security scans)
  - `ci/coverage` (Coverage reports)

#### Pull Request Reviews

- ✅ Require a pull request before merging
- ✅ Require approvals: `1`
- ✅ Dismiss stale PR approvals when new commits are pushed
- ✅ Require review from code owners

#### Restrictions

- ✅ Restrict pushes that create files larger than 100MB
- ✅ Do not allow bypassing the above settings
- ✅ Include administrators

### 3. Configure Dev Branch Protection

1. Click "Add rule" again
2. In "Branch name pattern", enter: `dev`
3. Apply the same settings as the main branch

### 4. Configure Code Owners

1. Go to "Code owners" in the left sidebar
2. Create or update `.github/CODEOWNERS` file:

```
# Global code owners
* @username1 @username2

# Core functionality
/src/ @username1
/tests/ @username1 @username2

# Dashboard
/dashboard/ @username2

# Documentation
/docs/ @username1
*.md @username1
```

## GitHub Actions Workflow Setup

### 1. Create Workflow Directory

```bash
mkdir -p .github/workflows
```

### 2. Create CI Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
        id: test

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint
        id: lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run TypeScript type check
        run: npm run type-check
        id: type-check

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        id: build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run security audit
        run: npm audit --audit-level moderate
        id: security-audit

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
        id: security-scan

  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage
        id: coverage

      - name: Check coverage threshold
        run: npm run coverage:check
```

### 3. Create Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "coverage:check": "jest --coverage --coverageThreshold='{\"global\":{\"branches\":80,\"functions\":80,\"lines\":80,\"statements\":80}}'",
    "lint": "eslint src/ tests/ --ext .ts,.tsx",
    "lint:fix": "eslint src/ tests/ --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "build": "tsc && npm run build:dashboard",
    "build:dashboard": "cd dashboard && npm run build",
    "security:audit": "npm audit --audit-level moderate",
    "security:scan": "snyk test"
  }
}
```

## Verification

### 1. Test Branch Protection

1. Create a test branch: `git checkout -b test-protection`
2. Make a small change and commit
3. Push the branch: `git push origin test-protection`
4. Create a pull request to `main`
5. Verify that:
   - Status checks are required
   - Reviews are required
   - You cannot merge without approval

### 2. Test Status Checks

1. Create a PR with failing tests
2. Verify the PR cannot be merged
3. Fix the tests and verify the PR can be merged

### 3. Test Admin Override

1. As an admin, try to push directly to main
2. Verify the push is blocked
3. Test emergency override procedures

## Troubleshooting

### Common Issues

#### Status Checks Not Appearing

- Ensure GitHub Actions workflows are properly configured
- Check that workflow files are in `.github/workflows/`
- Verify workflow syntax is correct

#### Reviews Not Required

- Check that "Require a pull request before merging" is enabled
- Verify the number of required approvals is set correctly
- Ensure code owners are properly configured

#### Admin Override Not Working

- Check "Include administrators" is enabled
- Verify admin permissions in repository settings
- Test with a non-admin account first

### Getting Help

- Check GitHub's documentation on branch protection
- Review the repository's GitHub Actions logs
- Contact repository administrators
- Create an issue in the repository

## Maintenance

### Regular Tasks

- Review and update protection rules quarterly
- Monitor status check performance
- Update security scanning tools
- Review and update code owners

### Monitoring

- Set up notifications for failed status checks
- Monitor PR review times
- Track security scan results
- Review coverage trends
