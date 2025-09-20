# Librán Voice Forge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-blue)](https://openai.com/)

> Transform English text into the ancient language of Librán and bring it to life with AI-powered voice synthesis.

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
- Node.js 18+ 
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

### Phase 4: Batch Rendering
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
