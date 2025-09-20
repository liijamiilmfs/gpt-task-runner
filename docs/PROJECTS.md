# GitHub Projects Automation

## Prerequisites
- Authenticate the GitHub CLI: `gh auth login`
- Install [`jq`](https://stedolan.github.io/jq/) for JSON processing.

## Example Usage
```bash
bash scripts/setup_github_project.sh \
  --owner YOUR_ORG_OR_USER \
  --repo libran-voice \
  --project-name "Librán Voice Forge" \
  --visibility PRIVATE
```

The script supports additional flags such as `--project-description` and `--dry-run` to customize behavior.
