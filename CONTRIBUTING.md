# Contributing to Librán Voice Forge

Thank you for your interest in contributing to Librán Voice Forge! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites
- Node.js 18 or higher
- pnpm (recommended) or npm
- Git

### Local Development

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/your-username/libran-voice-forge.git
   cd libran-voice-forge
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your OpenAI API key
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

5. **Run type checking:**
   ```bash
   pnpm type-check
   ```

6. **Run linting:**
   ```bash
   pnpm lint
   ```

## Code Style

### TypeScript
- Use TypeScript for all new code
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Follow the existing code patterns

### React/Next.js
- Use functional components with hooks
- Prefer `const` over `let` when possible
- Use meaningful variable and function names
- Keep components focused and single-purpose

### Styling
- Use Tailwind CSS for styling
- Follow the existing design system
- Use the `libran-*` color palette for theming
- Keep responsive design in mind

### File Organization
```
app/
├── api/           # API routes
├── components/    # Reusable components
├── lib/          # Utility functions and libraries
└── page.tsx      # Main page

lib/
├── dictionaries/  # Translation dictionaries
├── translator/    # Translation logic
└── tts/          # Text-to-speech utilities
```

## Commit Style

We follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(translator): add support for Ancient Librán variant
fix(tts): resolve audio streaming timeout issue
docs(readme): update installation instructions
```

## Adding Dictionary Entries

### Dictionary Format
Dictionaries are stored in `/lib/dictionaries/` as JSON files:

```json
{
  "version": "1.0.0",
  "language": "ancient-libran",
  "entries": {
    "hello": "salaam",
    "world": "dunya",
    "peace": "aman"
  },
  "rules": {
    "plural_suffix": "an",
    "verb_ending": "ar"
  }
}
```

### Adding New Entries

1. **Choose the appropriate dictionary:**
   - `ancient-libran.json` for Ancient Librán
   - `modern-libran.json` for Modern Librán

2. **Add your entries:**
   ```json
   {
     "english_word": "libran_translation",
     "phrase": "libran_phrase_translation"
   }
   ```

3. **Follow naming conventions:**
   - Use lowercase for English keys
   - Use appropriate diacritics for Librán text
   - Maintain consistency with existing entries

4. **Test your additions:**
   ```bash
   pnpm dev
   # Test translation in the web interface
   ```

### Diacritics and Special Characters
- Use UTF-8 encoding
- Include pronunciation notes in comments
- Test with different browsers and devices

## Filing Issues

### Bug Reports
When filing a bug report, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Environment details** (OS, browser, Node version)
5. **Screenshots** if applicable
6. **Console errors** if any

### Feature Requests
For feature requests, please include:

1. **Clear description** of the proposed feature
2. **Use case** and motivation
3. **Proposed implementation** (if you have ideas)
4. **Alternative solutions** considered

### Issue Template
```markdown
## Description
Brief description of the issue or feature request.

## Steps to Reproduce (for bugs)
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: [e.g., Windows 10, macOS 12, Ubuntu 20.04]
- Browser: [e.g., Chrome 91, Firefox 89, Safari 14]
- Node.js version: [e.g., 18.0.0]

## Additional Context
Add any other context about the problem here.
```

## Pull Request Process

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Write clean, well-documented code
   - Add tests if applicable
   - Update documentation as needed

3. **Test your changes:**
   ```bash
   pnpm type-check
   pnpm lint
   pnpm dev  # Test manually
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat(scope): your commit message"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request:**
   - Use the PR template
   - Link related issues
   - Request review from maintainers

## Review Process

- All PRs require review before merging
- Address feedback promptly
- Keep PRs focused and reasonably sized
- Update documentation for user-facing changes

## Questions?

If you have questions about contributing, please:

1. Check existing issues and discussions
2. Open a new issue with the "question" label
3. Join our community discussions

Thank you for contributing to Librán Voice Forge! 🎭

