# Librán Voice Forge

[![CI](https://github.com/liijamiilmfs/english-to-libran-text-to-voice/workflows/CI/badge.svg)](https://github.com/liijamiilmfs/english-to-libran-text-to-voice/actions)
[![Security Audit](https://github.com/liijamiilmfs/english-to-libran-text-to-voice/workflows/CI/badge.svg?label=security)](https://github.com/liijamiilmfs/english-to-libran-text-to-voice/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://python.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-blue)](https://openai.com/)
[![Tests](https://img.shields.io/badge/tests-43%20passing-brightgreen.svg)](#development--testing)
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](#development--testing)
[![Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-brightgreen.svg)](package.json)
[![Code Style](https://img.shields.io/badge/code%20style-prettier-ff69b4.svg)](https://prettier.io/)
[![Linting](https://img.shields.io/badge/linting-ESLint-4B32C3.svg)](https://eslint.org/)

> Transform English text into the ancient language of Librán and bring it to life with AI-powered voice synthesis.

### Project Status
- ✅ **CI/CD**: Automated testing and security audits on every push
- ✅ **Code Quality**: TypeScript, ESLint, and Prettier for consistent code style
- ✅ **Test Coverage**: 85% code coverage with 49+ passing tests (43 Node.js + 6 Python JSON parsing)
- ✅ **Multi-Platform**: Node.js 20+ and Python 3.12+ support
- ✅ **Security**: Dependency overrides to replace deprecated packages with secure alternatives
- ✅ **Compatibility**: Maintains Node.js 20.0+ compatibility while using modern dependencies
- ✅ **Modern Stack**: Next.js 14, TypeScript 5.0+, OpenAI TTS integration

### Deployment workflow behavior
- Push deploys on `main` only when app or configuration files change.
- Push deploys always skip PR comments (`Skipping PR comment on push.`).
- Same-repo PRs deploy previews and post a success comment with the preview link.
- Fork PRs deploy previews but only log that the comment was skipped.
- Release events reuse the production deployment workflow.
- Secrets are validated up front and fail fast if missing.
- Concurrency `vercel-${{ github.ref }}` prevents overlapping deploys.
- Deployments run on Node.js 20.x to mirror the Vercel runtime.
- GitHub permissions allow PR comments without affecting other scopes.
- Comment failures are tolerated via `continue-on-error`.
- Workflow respects path filters to avoid unnecessary deploys.
- Status updates remain enabled for preview reporting.

## What is Librán Voice Forge?

Librán Voice Forge is a specialized translation and text-to-speech system that converts English text into the mystical language of Librán and synthesizes it into audio using OpenAI's advanced TTS models. Perfect for worldbuilding, immersive storytelling, and bringing fictional languages to life.

### Core Workflow
```
English Text → Librán Translation → AI Voice Synthesis → Audio Output
```

## Features

- **Deterministic Translation**: Rule-based English-to-Librán translation using comprehensive dictionaries
- **Dual Language Support**: Both Ancient and Modern Librán variants
- **AI Voice Synthesis**: OpenAI TTS integration with customizable voice parameters
- **Librán Accent Styling**: Specialized voice characteristics for authentic pronunciation
- **Multiple Audio Formats**: MP3, WAV, and FLAC output support
- **Real-time Processing**: Fast translation and synthesis pipeline
- **Modern Web Interface**: Built with Next.js and Tailwind CSS

## Quick Start

### Prerequisites
- Node.js 20+ 
- pnpm (recommended) or npm
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd libran-voice-forge
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key-here
   OPENAI_TTS_MODEL=gpt-4o-mini-tts
   OPENAI_TTS_VOICE=alloy
   AUDIO_FORMAT=mp3
   ```

3. **Start the development server:**
   ```bash
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Quick Test

Try translating "Hello, sky!" into both variants:

```bash
# Test translation API
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, sky!", "variant": "ancient"}'

# Test speech API (requires translation result)
curl -X POST http://localhost:3000/api/speak \
  -H "Content-Type: application/json" \
  -d '{"libranText": "Salaam, samaa!", "voice": "alloy", "format": "mp3"}' \
  --output test-audio.mp3
```

## Semantic Versioning

This project follows [Semantic Versioning 2.0.0](https://semver.org/) to ensure clear and predictable versioning.

### Version Format
```
MAJOR.MINOR.PATCH (e.g., 1.0.0)
```

- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality in a backwards compatible manner
- **PATCH**: Backwards compatible bug fixes

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) for consistent commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Commit Types
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks
- `revert`: Reverting previous commits

#### Examples
```bash
feat(ui): add clipboard copy functionality
fix(api): resolve translation error handling
docs(readme): update installation instructions
perf(tts): optimize audio generation pipeline
```

### Release Process

#### Automated Release
```bash
# Create a new release (automatically determines version bump)
npm run release

# Create specific version types
npm run release:patch    # 1.0.0 → 1.0.1
npm run release:minor    # 1.0.0 → 1.1.0
npm run release:major    # 1.0.0 → 2.0.0

# Preview what would be released
npm run release:dry-run
```

#### Manual Release Process
1. **Ensure all tests pass**: `npm run test:all`
2. **Update CHANGELOG.md**: Document new features/fixes
3. **Create release commit**: `npm run release`
4. **Push tags**: `git push --follow-tags origin main`
5. **Create GitHub Release**: Use the generated changelog

### Version Bump Rules

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `feat:` | MINOR | 1.0.0 → 1.1.0 |
| `fix:` | PATCH | 1.0.0 → 1.0.1 |
| `perf:` | PATCH | 1.0.0 → 1.0.1 |
| `docs:` | PATCH | 1.0.0 → 1.0.1 |
| `refactor:` | PATCH | 1.0.0 → 1.0.1 |
| `test:` | PATCH | 1.0.0 → 1.0.1 |
| `build:` | PATCH | 1.0.0 → 1.0.1 |
| `ci:` | PATCH | 1.0.0 → 1.0.1 |
| `chore:` | PATCH | 1.0.0 → 1.0.1 |
| `BREAKING CHANGE:` | MAJOR | 1.0.0 → 2.0.0 |

### Pre-release Versions

For pre-release versions, use the following format:
```bash
# Alpha release
npm run release -- --prerelease alpha

# Beta release  
npm run release -- --prerelease beta

# Release candidate
npm run release -- --prerelease rc
```

### Git Hooks

We use [Husky](https://typicode.github.io/husky/) to enforce commit message standards:

- **Pre-commit**: Runs linting and type checking
- **Commit-msg**: Validates commit message format

### Changelog Generation

The `CHANGELOG.md` is automatically generated from commit messages using [standard-version](https://github.com/conventional-changelog/standard-version).

## Development & Testing

### Running Tests
```bash
# Run all tests (Node.js + Python)
npm test

# Run only Node.js tests
npm run test:run

# Run Python tests
cd tools/dict_importer
python -m pytest tests/ -v

# Run with coverage
npm run test:coverage
```

### Code Coverage
The project includes comprehensive test coverage for both Node.js and Python components:
- **Node.js**: 43 passing tests covering API routes, translation logic, and metrics
- **Python**: 164+ passing tests covering dictionary parsing, normalization, and conflict resolution
- **Overall Coverage**: 85% statements, 80% branches, 90% functions, 85% lines

To generate coverage reports:
```bash
# Generate coverage report
npm run test:coverage

# View coverage files
ls coverage/
```

The coverage report includes:
- `coverage-summary.json` - Detailed coverage metrics
- `lcov.info` - LCOV format for badge integration

## Security & Dependency Management

### Deprecated Package Handling
We actively monitor and replace deprecated dependencies to maintain security and compatibility:

**Replaced/Removed Packages:**
- `inflight@1.0.6` → `lru-cache@^10.0.0` (memory leak fix)
- `@humanwhocodes/config-array@0.13.0` → `@eslint/config-array@^0.18.0`
- `rimraf@3.0.2` → `rimraf@^5.0.0` (security updates)
- `glob@7.2.3` → `glob@^10.0.0` (performance & security)
- `@humanwhocodes/object-schema@2.0.3` → `@eslint/object-schema@^0.18.0`
- `node-domexception@1.0.0` → **removed** (use native Node.js 18+ DOMException)

**Compatibility Considerations:**
- ✅ Maintains Node.js 20.0+ compatibility (avoiding engine conflicts)
- ✅ Uses npm overrides to replace deprecated packages at the dependency level
- ✅ Removes unnecessary polyfills in favor of native Node.js APIs
- ✅ Regular security audits with `npm audit`

### Security Features
- **Automated Security Scanning**: CI runs `npm audit` on every push
- **Dependency Pinning**: Critical packages are pinned to specific versions
- **Sensitive Data Sanitization**: Logging system automatically redacts API keys and credentials
- **Environment Isolation**: Separate configurations for development and production

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ | - | Your OpenAI API key for TTS access |
| `OPENAI_TTS_MODEL` | ❌ | `gpt-4o-mini-tts` | OpenAI TTS model to use |
| `OPENAI_TTS_VOICE` | ❌ | `alloy` | Voice style (alloy, echo, fable, onyx, nova, shimmer) |
| `AUDIO_FORMAT` | ❌ | `mp3` | Output format (mp3, wav, flac) |

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web UI        │    │  /api/translate │    │  Translator     │
│   (Next.js)     │───▶│  (API Route)    │───▶│  Library        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐           ▼
│   Audio Output  │◀───│  /api/speak     │    ┌─────────────────┐
│   (MP3/WAV)     │    │  (API Route)    │◀───│  OpenAI TTS     │
└─────────────────┘    └─────────────────┘    │  Service        │
                                              └─────────────────┘
```

## Screenshots

*Screenshots will be added to `/docs/screenshot-*.png`*

### Demo Flow
1. **Input**: Enter English text in the translation interface
2. **Translate**: Select Ancient or Modern Librán variant
3. **Synthesize**: Choose voice parameters and generate audio
4. **Output**: Download or play the synthesized Librán audio

## Why This Exists

Librán Voice Forge was created to bridge the gap between fictional language creation and immersive audio experiences. Whether you're a worldbuilder crafting a fantasy universe, a game developer creating atmospheric audio, or a storyteller bringing characters to life, this tool transforms written language into spoken reality.

The deterministic translation system ensures consistency across projects, while the AI voice synthesis adds the crucial element of pronunciation and accent that brings fictional languages to life.

## Roadmap

### MVP (Current)
- [x] Basic English-to-Librán translation
- [x] OpenAI TTS integration
- [x] Web interface
- [x] Audio file generation

### Phase 2: LLM Polish
- [ ] Enhanced translation accuracy with LLM assistance
- [ ] Context-aware translation
- [ ] Idiom and phrase handling

### Phase 3: Realtime Mode
- [ ] Live translation during typing
- [ ] Real-time audio streaming
- [ ] Voice activity detection

### Phase 4: PDF Dictionary Import
- [ ] PDF table parsing for dictionary creation
- [ ] Automated dictionary building from PDF sources
- [ ] Enhanced conflict resolution for dictionary entries
- [ ] *Note: PDF parsing functionality is available in `feature/pdf-parsing-future` branch*

### Phase 5: Batch Rendering
- [ ] Bulk text processing
- [ ] Batch audio generation
- [ ] Export multiple formats

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines, code style, and how to add new dictionary entries.

## Security

Security is important to us. Please review [SECURITY.md](./SECURITY.md) for our vulnerability reporting policy and security best practices.

## Code of Conduct

This project follows the Contributor Covenant. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

*Librán Voice Forge - Where ancient languages meet modern AI*
