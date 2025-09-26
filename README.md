# GPT Task Runner

[![CI/CD Pipeline](https://github.com/liijamiilmfs/gpt-task-runner/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/liijamiilmfs/gpt-task-runner/actions)
[![Security Scans](https://github.com/liijamiilmfs/gpt-task-runner/workflows/Security%20Scans/badge.svg)](https://github.com/liijamiilmfs/gpt-task-runner/actions)
[![Coverage](https://codecov.io/gh/liijamiilmfs/gpt-task-runner/branch/dev/graph/badge.svg)](https://codecov.io/gh/liijamiilmfs/gpt-task-runner)

A powerful task runner and automation tool designed to work with GPT models for intelligent task execution and workflow management.

## Features

- 🤖 GPT-powered task execution
- 📋 Task management and tracking
- 🔄 Workflow automation
- 📊 Progress monitoring
- 🛠️ Extensible plugin system

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- OpenAI API key (or compatible GPT API)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/gpt-task-runner.git
cd gpt-task-runner
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

### Usage

```bash
# Run a task
npm run task <task-name>

# Start the development server
npm run dev

# Build for production
npm run build
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
TASK_RUNNER_CONFIG=./config/tasks.json
LOG_LEVEL=info
```

## Project Structure

```
gpt-task-runner/
├── src/                    # Source code
├── config/                 # Configuration files
├── tasks/                  # Task definitions
├── docs/                   # Documentation
├── tests/                  # Test files
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore patterns
├── LICENSE                # License file
└── README.md              # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please:

1. Check the [Issues](https://github.com/yourusername/gpt-task-runner/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

## 🚀 TopTier Organization Initiative

This project is undergoing a comprehensive reorganization to achieve top-tier application standards. See our detailed [Project Plan](PROJECT_PLAN.md) for milestones, deliverables, and architectural improvements.

### Key Focus Areas
- **Architecture**: Modular, scalable, and maintainable codebase
- **Quality**: 95%+ test coverage with comprehensive QA
- **Performance**: Optimized for high-throughput task processing
- **Observability**: Advanced monitoring, logging, and alerting
- **DevOps**: Containerized deployment with CI/CD automation

### Current Progress
- ✅ **Phase 1**: Project structure and documentation (In Progress)
- ⏳ **Phase 2**: Testing & Quality Assurance (Oct 24, 2025)
- ⏳ **Phase 3**: Performance & Scalability (Nov 7, 2025)
- ⏳ **Phase 4**: Observability & Monitoring (Nov 21, 2025)
- ⏳ **Phase 5**: Deployment & DevOps (Dec 5, 2025)
- ⏳ **Phase 6**: Advanced Features (Dec 19, 2025)

### Documentation
- See `docs/roadmap.md` and `docs/milestones.md` for detailed milestones and deliverables aligned with TopTier practices
- Check `PROJECT_ORGANIZATION_SUMMARY.md` for comprehensive project organization details

## Legacy Roadmap (Completed)

- ✅ Web-based dashboard
- ✅ Task scheduling capabilities
- ✅ Integration with popular CI/CD tools
- ✅ Advanced logging and analytics
- ✅ Multi-model support

---

Made with ❤️ by the GPT Task Runner team
