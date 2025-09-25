# Branch Protection Scripts

This directory contains automated scripts for setting up branch protection rules on GitHub repositories.

## Scripts

### `setup-branch-protection.js`
Node.js script for setting up branch protection rules using the GitHub CLI.

**Usage:**
```bash
node setup-branch-protection.js [--verbose]
```

**Features:**
- Automatically detects repository name
- Sets up protection for main and dev branches
- Creates CODEOWNERS file
- Verifies protection rules
- Comprehensive error handling and logging

### `setup-branch-protection.ps1`
PowerShell script for Windows environments.

**Usage:**
```powershell
.\setup-branch-protection.ps1 [-Verbose] [-Repository "owner/repo"] [-Branches @("main", "dev")]
```

**Features:**
- Windows-optimized execution
- Parameter support for customization
- Same functionality as Node.js version

### `setup-branch-protection.sh`
Bash script for Unix-like environments.

**Usage:**
```bash
./setup-branch-protection.sh [--verbose] [--help]
```

**Features:**
- Cross-platform Unix compatibility
- Color-coded output
- Help documentation
- Environment variable support

## Prerequisites

### Required Tools
- **GitHub CLI (gh)**: Must be installed and authenticated
- **Node.js**: For the JavaScript version (v14 or higher)
- **PowerShell**: For the PowerShell version (Windows)
- **Bash**: For the shell script version (Unix/Linux/macOS)

### Required Permissions
- Admin access to the target repository
- GitHub CLI authenticated with appropriate permissions

## Configuration

### Environment Variables
- `GITHUB_REPOSITORY`: Override repository name (format: owner/repo)

### Command Line Options

#### Node.js Script
- `--verbose` or `-v`: Enable verbose output

#### PowerShell Script
- `-Verbose`: Enable verbose output
- `-Repository`: Specify repository name
- `-Branches`: Array of branch names to protect

#### Bash Script
- `--verbose` or `-v`: Enable verbose output
- `--help` or `-h`: Show help message

## Protection Rules Applied

### Status Checks
- `ci/tests` - CI/CD Pipeline tests
- `ci/lint` - Linting
- `ci/type-check` - Type checking
- `ci/build` - Build
- `ci/security` - Security scans
- `ci/coverage` - Coverage reports

### Pull Request Requirements
- 1 required approval
- Stale review dismissal enabled
- Code owner reviews required
- Up-to-date branches required

### Admin Settings
- Admin enforcement enabled
- Force pushes disabled
- Branch deletions disabled
- No branch restrictions (all users can create PRs)

## Usage Examples

### Basic Setup
```bash
# Using Node.js
node setup-branch-protection.js

# Using PowerShell
.\setup-branch-protection.ps1

# Using Bash
./setup-branch-protection.sh
```

### Verbose Output
```bash
# Node.js
node setup-branch-protection.js --verbose

# PowerShell
.\setup-branch-protection.ps1 -Verbose

# Bash
./setup-branch-protection.sh --verbose
```

### Custom Repository
```powershell
.\setup-branch-protection.ps1 -Repository "myorg/myrepo" -Branches @("main", "develop", "staging")
```

## Troubleshooting

### Common Issues

#### Authentication Errors
```
Error: GitHub CLI is not authenticated
```
**Solution:** Run `gh auth login` and follow the authentication process.

#### Permission Errors
```
Error: Cannot access repository: owner/repo
```
**Solution:** Ensure you have admin permissions on the repository.

#### Missing Dependencies
```
Error: GitHub CLI is not installed
```
**Solution:** Install GitHub CLI from https://cli.github.com/

### Debug Mode
All scripts support verbose output for debugging:
- Node.js: `--verbose`
- PowerShell: `-Verbose`
- Bash: `--verbose`

### Manual Verification
After running the scripts, verify the protection rules:
1. Go to repository Settings > Branches
2. Check that protection rules are applied
3. Test with a sample pull request

## Customization

### Modifying Protection Rules
Edit the configuration section in each script:

```javascript
// Node.js version
const CONFIG = {
  branches: ['main', 'dev'],
  requiredStatusChecks: [
    'ci/tests',
    'ci/lint', 
    'ci/type-check',
    'ci/build',
    'ci/security',
    'ci/coverage'
  ],
  // ... other settings
};
```

### Adding New Branches
Add branch names to the `branches` array in the configuration.

### Modifying Status Checks
Add or remove status check names from the `requiredStatusChecks` array.

## Security Considerations

- Scripts use GitHub CLI for authentication
- No hardcoded credentials or tokens
- All API calls use HTTPS
- Sensitive information is not logged

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review GitHub CLI documentation
3. Create an issue in the repository
4. Contact repository administrators

## License

These scripts are part of the GPT Task Runner project and are subject to the same license terms.
