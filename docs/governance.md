## Governance

This project adopts a lightweight governance model aligned with TopTier practices.

### Ownership and Reviews
- Code owners are defined in `.github/CODEOWNERS`.
- PRs require review by a code owner for protected areas.
- Follow small, scoped PRs with clear titles and acceptance criteria.

### Branching Policy
- `main`: stable, release-ready.
- `dev`: integration branch for upcoming release.
- Feature branches: `feat/*`, chores: `chore/*`, fixes: `fix/*`.

### Decision Records
- Record non-trivial technical decisions in `docs/adr/` as needed.

### Quality and Security
- CI must pass: lint, type-check, tests, and security scans.
- No secrets in repo; report via `SECURITY.md` process.
