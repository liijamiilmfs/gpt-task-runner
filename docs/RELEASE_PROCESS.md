# Automated Release Process

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) to automatically manage versioning and releases based on conventional commits.

## How It Works

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: A new feature (triggers MINOR version bump)
- `fix`: A bug fix (triggers PATCH version bump)
- `docs`: Documentation changes (no version bump)
- `style`: Code style changes (no version bump)
- `refactor`: Code refactoring (no version bump)
- `perf`: Performance improvements (triggers PATCH version bump)
- `test`: Adding or updating tests (no version bump)
- `build`: Build system changes (no version bump)
- `ci`: CI/CD changes (no version bump)
- `chore`: Maintenance tasks (no version bump)
- `revert`: Reverting changes (triggers PATCH version bump)
- `deps`: Dependency updates (triggers PATCH version bump)
- `deps-dev`: Dev dependency updates (no version bump)

**Breaking Changes:**

- Add `BREAKING CHANGE:` in the footer to trigger MAJOR version bump
- Or use `!` after the type/scope: `feat!:` or `feat(scope)!:`

### Examples

```bash
# Minor version bump (new feature)
feat: add automated semantic versioning

# Patch version bump (bug fix)
fix: resolve memory leak in batch processing

# Major version bump (breaking change)
feat!: redesign API interface

BREAKING CHANGE: The API interface has been completely redesigned

# No version bump (documentation)
docs: update README with new examples

# Patch version bump (dependency update)
deps: update lodash to v4.17.21
```

## Using Commitizen

We provide a guided commit interface:

```bash
# Interactive commit with prompts
npm run commit

# Retry last commit if it failed
npm run commit:retry
```

## Automated Release Process

### What Happens Automatically

1. **On push to `main` branch:**
   - Analyzes commits since last release
   - Determines next version number
   - Generates/updates CHANGELOG.md
   - Creates Git tag
   - Creates GitHub release
   - Updates package.json version

2. **On push to `dev` branch:**
   - Same as main, but creates beta releases (e.g., `1.2.3-beta.1`)

### Manual Release

You can also trigger a release manually:

```bash
# Dry run (see what would be released)
npx semantic-release --dry-run

# Actual release
npm run semantic-release
```

## Branch Strategy

- **`main`**: Production releases (1.0.0, 1.1.0, 2.0.0)
- **`dev`**: Beta releases (1.1.0-beta.1, 1.1.0-beta.2)

## Configuration

- **`.releaserc.json`**: Semantic-release configuration
- **`commitlint.config.js`**: Commit message validation rules
- **`.husky/`**: Git hooks for commit validation

## Benefits

✅ **Automated versioning** - No manual version bumps  
✅ **Automatic changelog** - Generated from commit messages  
✅ **GitHub releases** - Created automatically with release notes  
✅ **Consistent commits** - Enforced via commitlint and commitizen  
✅ **CI/CD integration** - Runs automatically on push  
✅ **Beta releases** - Automatic pre-releases from dev branch

## Troubleshooting

### Commit Rejected

If your commit is rejected, check the commit message format:

```bash
# Check what's wrong
npx commitlint --edit .git/COMMIT_EDITMSG

# Fix and retry
git commit --amend
```

### Release Not Triggered

- Ensure commit messages follow conventional format
- Check that commits contain `feat:`, `fix:`, or `BREAKING CHANGE:`
- Verify you're pushing to `main` or `dev` branch
- Check GitHub Actions logs for errors

### Manual Override

If you need to manually create a release:

```bash
# Create a release commit
git commit --allow-empty -m "chore(release): 1.2.3 [skip ci]"
git tag v1.2.3
git push origin main --tags
```
