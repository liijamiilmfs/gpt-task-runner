# Project Structure

This project has been organized for better maintainability and clarity.

## Directory Structure

- **app/**: Next.js application files
- **lib/**: Core library code
  - **ai-integration/**: AI and machine learning integration
  - **translator/**: Translation engine
- **docs/**: Documentation files
- **scripts/**: Utility and build scripts
- **examples/**: Example usage files
- **test/**: Test files and test utilities
- **data/**: Data files (dictionaries, tranches, etc.)
- **logs/**: Log files and audit reports
- **tools/**: Development tools

## Root Directory

The root directory now contains only essential configuration files:
- Package management: `package.json`, `package-lock.json`
- Build configuration: `next.config.mjs`, `tsconfig.json`
- Linting: `commitlint.config.js`, `tailwind.config.js`
- Project info: `README.md`, `LICENSE`

## Adding New Files

When adding new files:
- **Scripts**: Place in `scripts/`
- **Documentation**: Place in `docs/`
- **Examples**: Place in `examples/`
- **Tests**: Place in `test/`
- **Data**: Place in `data/` (follow data organization guidelines)

This structure makes the project easier to navigate and maintain.
