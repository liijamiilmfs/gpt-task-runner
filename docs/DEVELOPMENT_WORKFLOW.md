# Development Workflow

This document outlines the development workflow for the GPT Task Runner project.

## Branch Strategy

### Primary Branches

- **`main`** - Production-ready code, protected branch
- **`dev`** - Integration branch for ongoing development

### Feature Branches

- **`feature/*`** - New features and enhancements
- **`bugfix/*`** - Bug fixes and patches
- **`chore/*`** - Maintenance tasks, refactoring, documentation

## Development Process

### 1. Starting New Work

```bash
# Always start from dev branch
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Development Workflow

```bash
# Work on your feature
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature-name
```

### 3. Integration Process

```bash
# Create PR from feature branch to dev
# After PR is approved and merged to dev:

# Update local dev
git checkout dev
git pull origin dev

# Delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

### 4. Release Process

```bash
# Create PR from dev to main
# After PR is approved and merged to main:
# - Automated semantic versioning will trigger
# - GitHub release will be created
# - NPM package will be published (if NPM_TOKEN configured)
```

## Branch Protection Rules

### Main Branch

- ✅ Requires pull request reviews
- ✅ Requires status checks to pass
- ✅ Requires branches to be up to date
- ❌ No direct pushes allowed
- ❌ No merge commits allowed

### Dev Branch

- ✅ Requires pull request reviews
- ✅ Requires status checks to pass
- ✅ Allows merge commits
- ❌ No direct pushes allowed

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **`feat`** - New feature
- **`fix`** - Bug fix
- **`docs`** - Documentation changes
- **`style`** - Code style changes (formatting, etc.)
- **`refactor`** - Code refactoring
- **`test`** - Adding or updating tests
- **`chore`** - Maintenance tasks

### Examples

```bash
git commit -m "feat: add batch processing support"
git commit -m "fix: resolve memory leak in task runner"
git commit -m "docs: update API documentation"
git commit -m "chore: update dependencies"
```

## Quality Gates

### Pre-commit Hooks

- ESLint code linting
- Prettier code formatting
- TypeScript type checking
- Test execution

### CI/CD Pipeline

- Automated testing (128 tests)
- Security scanning
- Code coverage reporting
- Build verification

## Release Management

### Automated Releases

- **Semantic Versioning** based on conventional commits
- **Automated Changelog** generation
- **GitHub Releases** with release notes
- **NPM Publishing** (when configured)

### Release Types

- **`feat:`** → Minor version bump (1.0.0 → 1.1.0)
- **`fix:`** → Patch version bump (1.0.0 → 1.0.1)
- **`BREAKING CHANGE:`** → Major version bump (1.0.0 → 2.0.0)

## Current Status

### Active Branches

- **`dev`** - Current development integration branch
- **`main`** - Production branch (protected)

### Feature Branches

- `feature/dashboard-cleanup`
- `feature/dry-run-mode`
- `feature/execution-engine-retry-backoff`
- `feature/idempotency-resume-support`
- `feature/issue-34-rate-limiting-concurrency`
- `feature/issue-39-ci-setup`
- `feature/issue-39-ci-smoke-dry-run`
- `feature/issue-55-automated-semantic-versioning` ✅ (merged)
- `feature/issue-56-cli-schedule-command`
- `feature/issue-58-dashboard-integration`
- `feature/issue-61-concurrency-controller-tests`
- `feature/issue-65-repository-visibility-strategy`
- `feature/issue-66-dictionary-qa-system`
- `feature/issue-7-batching-chunking-scheduling`
- `feature/issue-9-error-taxonomy`
- `feature/test-suite-improvements`

### Bugfix Branches

- `bugfix/build-errors-and-404s`
- `bugfix/sqlite-cannot-open-database-table`

### Chore Branches

- `chore/integrate-top-tier-organization`

## Best Practices

### 1. Branch Naming

- Use descriptive names: `feature/user-authentication`
- Include issue numbers: `feature/issue-123-add-logging`
- Use consistent prefixes: `feature/`, `bugfix/`, `chore/`

### 2. Commit Messages

- Use conventional commit format
- Be descriptive but concise
- Reference issues when applicable

### 3. Pull Requests

- Create PRs early for feedback
- Use descriptive titles and descriptions
- Link related issues
- Request appropriate reviewers

### 4. Testing

- Write tests for new features
- Ensure all tests pass before merging
- Maintain test coverage above 80%

### 5. Documentation

- Update documentation for new features
- Keep README.md current
- Document breaking changes

## Getting Started

### For New Contributors

1. **Fork the repository**
2. **Clone your fork**
3. **Set up development environment**
4. **Create feature branch from dev**
5. **Make your changes**
6. **Run tests and quality checks**
7. **Create pull request to dev**

### For Core Contributors

1. **Clone the main repository**
2. **Set up development environment**
3. **Create feature branch from dev**
4. **Make your changes**
5. **Run tests and quality checks**
6. **Create pull request to dev**
7. **After dev integration, create PR to main**

## Troubleshooting

### Common Issues

#### Merge Conflicts

```bash
# Resolve conflicts
git checkout dev
git pull origin dev
git checkout feature/your-branch
git rebase dev
# Resolve conflicts, then:
git add .
git rebase --continue
```

#### Failed Tests

```bash
# Run tests locally
npm test

# Run specific test
npm test -- --grep "test name"

# Run with coverage
npm run test:coverage
```

#### Linting Issues

```bash
# Fix linting issues
npm run lint:fix

# Fix formatting
npm run format
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Pull Request Best Practices](https://github.com/trein/dev-best-practices/wiki/Git-Commit-Best-Practices)

---

**Last Updated**: September 26, 2025
**Version**: 1.0.0
