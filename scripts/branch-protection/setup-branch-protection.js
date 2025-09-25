#!/usr/bin/env node

/**
 * Branch Protection Setup Script
 *
 * This script automatically configures branch protection rules for the repository
 * using the GitHub CLI. It sets up protection for both main and dev branches.
 *
 * Prerequisites:
 * - GitHub CLI (gh) must be installed and authenticated
 * - Repository must be accessible via GitHub CLI
 * - User must have admin permissions on the repository
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  branches: ['main', 'dev'],
  requiredStatusChecks: [
    'ci/tests',
    'ci/lint',
    'ci/type-check',
    'ci/build',
    'ci/security',
    'ci/coverage',
  ],
  requiredApprovals: 1,
  dismissStaleReviews: true,
  requireCodeOwnerReviews: true,
  requireUpToDateBranches: true,
  enforceAdmins: true,
  allowForcePushes: false,
  allowDeletions: false,
};

class BranchProtectionSetup {
  constructor() {
    this.repository = this.getRepositoryName();
    this.verbose =
      process.argv.includes('--verbose') || process.argv.includes('-v');
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    console.log(`${prefix} ${message}`);
  }

  getRepositoryName() {
    try {
      const result = execSync('gh repo view --json nameWithOwner', {
        encoding: 'utf8',
      });
      const repo = JSON.parse(result);
      return repo.nameWithOwner;
    } catch (error) {
      this.log(
        'Failed to get repository name. Make sure you are in a git repository with GitHub remote.',
        'error'
      );
      this.log(
        'You can also set the GITHUB_REPOSITORY environment variable.',
        'error'
      );
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...');

    // Check if GitHub CLI is installed
    try {
      execSync('gh --version', { stdio: 'pipe' });
      this.log('✓ GitHub CLI is installed');
    } catch (error) {
      this.log(
        '✗ GitHub CLI is not installed. Please install it first.',
        'error'
      );
      this.log('Visit: https://cli.github.com/', 'error');
      process.exit(1);
    }

    // Check if user is authenticated
    try {
      execSync('gh auth status', { stdio: 'pipe' });
      this.log('✓ GitHub CLI is authenticated');
    } catch (error) {
      this.log(
        '✗ GitHub CLI is not authenticated. Please run: gh auth login',
        'error'
      );
      process.exit(1);
    }

    // Check repository access
    try {
      execSync(`gh repo view ${this.repository}`, { stdio: 'pipe' });
      this.log(`✓ Repository access confirmed: ${this.repository}`);
    } catch (error) {
      this.log(`✗ Cannot access repository: ${this.repository}`, 'error');
      this.log(
        'Make sure you have admin permissions on this repository.',
        'error'
      );
      process.exit(1);
    }
  }

  async createBranchProtectionRule(branch) {
    this.log(`Setting up branch protection for: ${branch}`);

    const ruleConfig = {
      required_status_checks: {
        strict: CONFIG.requireUpToDateBranches,
        contexts: CONFIG.requiredStatusChecks,
      },
      enforce_admins: CONFIG.enforceAdmins,
      required_pull_request_reviews: {
        required_approving_review_count: CONFIG.requiredApprovals,
        dismiss_stale_reviews: CONFIG.dismissStaleReviews,
        require_code_owner_reviews: CONFIG.requireCodeOwnerReviews,
      },
      restrictions: null, // No branch restrictions
      allow_force_pushes: CONFIG.allowForcePushes,
      allow_deletions: CONFIG.allowDeletions,
    };

    try {
      // Create the branch protection rule
      const command = `gh api repos/${this.repository}/branches/${branch}/protection \
        --method PUT \
        --field required_status_checks='${JSON.stringify(ruleConfig.required_status_checks)}' \
        --field enforce_admins=${ruleConfig.enforce_admins} \
        --field required_pull_request_reviews='${JSON.stringify(ruleConfig.required_pull_request_reviews)}' \
        --field restrictions=null \
        --field allow_force_pushes=${ruleConfig.allow_force_pushes} \
        --field allow_deletions=${ruleConfig.allow_deletions}`;

      if (this.verbose) {
        this.log(`Executing: ${command}`);
      }

      execSync(command, { stdio: 'pipe' });
      this.log(`✓ Branch protection configured for: ${branch}`);
    } catch (error) {
      this.log(
        `✗ Failed to configure branch protection for: ${branch}`,
        'error'
      );
      if (this.verbose) {
        this.log(`Error details: ${error.message}`, 'error');
      }
      throw error;
    }
  }

  async createCodeOwnersFile() {
    this.log('Creating CODEOWNERS file...');

    const codeOwnersContent = `# Global code owners
* @${this.getCurrentUser()}

# Core functionality
/src/ @${this.getCurrentUser()}
/tests/ @${this.getCurrentUser()}

# Dashboard
/dashboard/ @${this.getCurrentUser()}

# Documentation
/docs/ @${this.getCurrentUser()}
*.md @${this.getCurrentUser()}

# Configuration files
package.json @${this.getCurrentUser()}
tsconfig.json @${this.getCurrentUser()}
.github/ @${this.getCurrentUser()}
`;

    const codeOwnersPath = path.join(process.cwd(), '.github', 'CODEOWNERS');

    // Create .github directory if it doesn't exist
    const githubDir = path.dirname(codeOwnersPath);
    if (!fs.existsSync(githubDir)) {
      fs.mkdirSync(githubDir, { recursive: true });
    }

    fs.writeFileSync(codeOwnersPath, codeOwnersContent);
    this.log('✓ CODEOWNERS file created');
  }

  getCurrentUser() {
    try {
      const result = execSync('gh api user', { encoding: 'utf8' });
      const user = JSON.parse(result);
      return user.login;
    } catch (error) {
      this.log('Failed to get current user. Using fallback.', 'warn');
      return 'username'; // Fallback
    }
  }

  async verifyBranchProtection(branch) {
    this.log(`Verifying branch protection for: ${branch}`);

    try {
      const result = execSync(
        `gh api repos/${this.repository}/branches/${branch}/protection`,
        { encoding: 'utf8' }
      );
      const protection = JSON.parse(result);

      this.log(`✓ Branch protection verified for: ${branch}`);
      if (this.verbose) {
        this.log(`Protection details: ${JSON.stringify(protection, null, 2)}`);
      }

      return true;
    } catch (error) {
      this.log(
        `✗ Branch protection verification failed for: ${branch}`,
        'error'
      );
      return false;
    }
  }

  async run() {
    try {
      this.log('Starting branch protection setup...');
      this.log(`Repository: ${this.repository}`);

      await this.checkPrerequisites();

      // Create CODEOWNERS file
      await this.createCodeOwnersFile();

      // Set up protection for each branch
      for (const branch of CONFIG.branches) {
        await this.createBranchProtectionRule(branch);
        await this.verifyBranchProtection(branch);
      }

      this.log('✓ Branch protection setup completed successfully!');
      this.log('');
      this.log('Next steps:');
      this.log('1. Set up GitHub Actions workflows for status checks');
      this.log('2. Review and update CODEOWNERS file');
      this.log('3. Test the protection rules with a test PR');
      this.log('4. Configure security scanning tools (Snyk, etc.)');
    } catch (error) {
      this.log('Branch protection setup failed!', 'error');
      if (this.verbose) {
        this.log(`Error details: ${error.message}`, 'error');
      }
      process.exit(1);
    }
  }
}

// Run the script
if (require.main === module) {
  const setup = new BranchProtectionSetup();
  setup.run();
}

module.exports = BranchProtectionSetup;
