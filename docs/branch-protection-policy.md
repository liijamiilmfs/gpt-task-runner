# Branch Protection Policy

## Overview

This document outlines the branch protection rules and policies for the GPT Task Runner repository to ensure code quality, security, and maintainability.

## Protected Branches

- `main` - Production branch
- `dev` - Development branch

## Protection Rules

### Required Status Checks

All pull requests must pass the following status checks before merging:

1. **CI/CD Pipeline Tests**
   - Unit tests must pass
   - Integration tests must pass
   - End-to-end tests must pass

2. **Linting**
   - ESLint checks must pass
   - Code style consistency enforced

3. **Type Checking**
   - TypeScript compilation must succeed
   - No type errors allowed

4. **Build**
   - Application must build successfully
   - All dependencies must resolve correctly

5. **Security Scans**
   - Dependency vulnerability scanning
   - Code security analysis
   - Secret detection

6. **Coverage Reports**
   - Minimum code coverage threshold: 80%
   - Coverage reports must be generated and reviewed

### Pull Request Requirements

#### Review Requirements

- **1 Required Approval**: At least one team member must approve the PR
- **Stale Review Dismissal**: Reviews are dismissed when new commits are pushed
- **Reviewer Requirements**:
  - At least one reviewer with write access
  - Code owners must review changes to their areas

#### Branch Requirements

- **Up-to-date Branches**: Branch must be up to date with target branch before merging
- **No Merge Commits**: Linear history preferred (squash and merge)
- **No Force Pushes**: Force pushes to protected branches are not allowed

### Admin Enforcement

- **Even admins must follow these rules**: No bypassing of protection rules
- **Admin Override**: Only available for emergency hotfixes with proper documentation

### Access Control

- **No Branch Restrictions**: All users can create pull requests
- **Write Access**: Limited to core team members
- **Admin Access**: Repository administrators only

## Implementation

### Automated Setup

Use the provided scripts in `scripts/branch-protection/` to automatically configure branch protection rules.

### Manual Setup

Follow the manual instructions in `docs/branch-protection-setup.md` for detailed configuration steps.

## Monitoring and Compliance

### Status Check Monitoring

- All status checks are monitored via GitHub Actions
- Failed checks block merging automatically
- Check status is visible in PR interface

### Review Process

- PRs without required approvals cannot be merged
- Stale reviews are automatically dismissed on new commits
- Review reminders are sent after 24 hours of inactivity

### Security Compliance

- Security scans run on every PR
- Vulnerabilities are reported and must be addressed
- Dependencies are automatically updated when safe

## Exceptions and Overrides

### Emergency Hotfixes

In case of critical production issues:

1. Create hotfix branch from main
2. Apply minimal fix
3. Document the emergency in PR description
4. Admin can override protection rules
5. Post-incident review required

### Documentation Updates

For documentation-only changes:

- Same review requirements apply
- Status checks may be reduced (no build required)
- Security scans still required

## Best Practices

### Before Creating PR

1. Ensure all tests pass locally
2. Run linting and type checking
3. Update documentation if needed
4. Write clear PR description

### During Review

1. Review code thoroughly
2. Check test coverage
3. Verify security implications
4. Test changes locally if needed

### After Merge

1. Monitor deployment
2. Verify functionality
3. Update related documentation
4. Clean up feature branches

## Contact and Support

For questions about branch protection policies or to request exceptions:

- Create an issue in the repository
- Contact repository administrators
- Refer to team documentation for specific workflows
