# Contributing to GPT Task Runner

Thank you for your interest in contributing to the GPT Task Runner project! This guide will help you get started with contributing to our codebase.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js (v20.17.0 or higher)
- npm (v10.0.0 or higher)
- Git

### Setup Development Environment

1. **Fork and Clone the Repository**

   ```bash
   git clone https://github.com/your-username/gpt-task-runner.git
   cd gpt-task-runner
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Up Environment Variables**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Run Tests**

   ```bash
   npm test
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `chore/description` - Maintenance tasks
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(api): add webhook support for task notifications
fix(cli): resolve issue with CSV parsing for large files
docs(readme): update installation instructions
test(validation): add tests for task schema validation
```

## Coding Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Provide proper type annotations
- Avoid `any` type unless absolutely necessary
- Use interfaces for object shapes
- Use enums for constants

### Code Style

- Use Prettier for code formatting
- Follow ESLint rules
- Use meaningful variable and function names
- Write self-documenting code
- Add comments for complex logic

### File Organization

```
src/
├── app/                 # Next.js app directory
├── components/          # Reusable React components
├── lib/                # Utility libraries
├── types.ts            # Type definitions
├── validation/         # Input validation
├── transports/         # API transport layers
└── utils/              # Utility functions
```

## Testing Guidelines

### Test Types

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test component interactions
3. **E2E Tests** - Test complete user workflows

### Testing Best Practices

- Write tests for all new features
- Maintain test coverage above 90%
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## Pull Request Process

### Before Submitting

1. **Run Quality Checks**

   ```bash
   npm run check
   ```

2. **Update Documentation**
   - Update README if needed
   - Add/update API documentation
   - Update CHANGELOG.md

3. **Test Your Changes**
   - Run full test suite
   - Test manually in development environment
   - Verify no breaking changes

### PR Requirements

- [ ] All tests pass
- [ ] Code coverage maintained
- [ ] Documentation updated
- [ ] No linting errors
- [ ] Descriptive PR title and description
- [ ] Link to related issues

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## Issue Reporting

### Bug Reports

Use the bug report template and include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

### Feature Requests

Use the feature request template and include:

- Clear description of the feature
- Use case and benefits
- Proposed implementation (if any)
- Alternative solutions considered

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high/medium/low` - Priority level

## Development Tips

### Debugging

- Use VS Code debugger configuration
- Add console.log statements for debugging
- Use browser dev tools for frontend issues
- Check logs for backend issues

### Performance

- Profile code for performance bottlenecks
- Optimize database queries
- Use caching where appropriate
- Monitor memory usage

### Security

- Never commit sensitive data
- Use environment variables for secrets
- Validate all inputs
- Follow OWASP guidelines

## Getting Help

### Resources

- [Project Documentation](./docs/)
- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)

### Communication

- GitHub Issues for bug reports and feature requests
- GitHub Discussions for questions and ideas
- Code reviews for feedback on implementations

## Recognition

Contributors will be recognized in:

- CONTRIBUTORS.md file
- Release notes for significant contributions
- GitHub contributor graphs

Thank you for contributing to GPT Task Runner! 🚀
