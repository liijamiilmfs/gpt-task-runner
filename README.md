# GPT Task Runner

A powerful Windows service with web dashboard for GPT-powered task automation and intelligent workflow management.

## Features

- 🤖 GPT-powered task execution
- 📋 Task management and tracking
- 🔄 Workflow automation with scheduling
- 📊 Real-time dashboard and monitoring
- 🛠️ Extensible plugin system
- 🧪 **Dry-run mode for safe testing**
- 🖥️ **Windows Service integration**
- 📈 **Web dashboard for monitoring**
- ⏰ **Automated scheduling (cron)**
- 💾 **SQLite database for persistence**

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- OpenAI API key (or compatible GPT API)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/liijamiilmfs/gpt-task-runner.git
cd gpt-task-runner
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your API keys and configuration
```

4. Build the project:
```bash
npm run build
```

### Usage

#### Windows Service Mode (Recommended)

1. **Install as Windows Service:**
```bash
# Build the project
npm run build

# Install as Windows service (requires admin privileges)
npm run install-service
```

2. **Access the Dashboard:**
   - Open your browser to `http://localhost:3000`
   - Monitor task executions, schedule new tasks, and view logs

3. **Manage the Service:**
```bash
# Uninstall the service
npm run uninstall-service
```

#### Development Mode

```bash
# Start both service and dashboard in development
npm run dev:all

# Or start individually
npm run dev:service    # Start the service
npm run dev:dashboard  # Start the dashboard
```

#### CLI Mode (Legacy)

```bash
# Dry run with CSV input
npm run dev run -- --input examples/sample-tasks.csv --dry-run

# Live execution
npm run dev run -- --input examples/sample-tasks.csv --output results.csv

# Single task execution
npm run dev run -- --prompt "Write a haiku about coding" --dry-run
```

#### Command Line Options

- `--input, -i <path>`: Input file path (CSV or JSONL)
- `--prompt, -p <text>`: Single prompt to execute
- `--output, -o <path>`: Output file path (CSV or JSONL)
- `--dry-run`: Simulate execution without making API calls
- `--verbose, -v`: Enable verbose logging
- `--model <model>`: OpenAI model to use (default: gpt-3.5-turbo)
- `--temperature <number>`: Temperature for generation (default: 0.7)
- `--max-tokens <number>`: Maximum tokens to generate (default: 1000)

## Dry Run Mode

The `--dry-run` flag allows you to:

- ✅ Validate batch orchestration and logging
- ✅ Preview costs and token usage
- ✅ Test your input files safely
- ✅ Generate deterministic JSONL output
- ✅ Verify success/failure logic without side effects

### Dry Run Output

When using `--dry-run`, the tool generates:
- Simulated responses based on your prompts
- Realistic token usage estimates
- Cost calculations
- Both regular results and dry-run specific results

Example dry run output:
```json
{
  "id": "task-1",
  "request": {
    "id": "task-1",
    "prompt": "Write a haiku about programming",
    "model": "gpt-3.5-turbo"
  },
  "simulatedResponse": "This is a simulated response for task \"task-1\"...",
  "simulatedUsage": {
    "promptTokens": 12,
    "completionTokens": 45,
    "totalTokens": 57
  },
  "simulatedCost": 0.000087,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "success": true
}
```

## Input Formats

### CSV Format

```csv
id,prompt,model,temperature,maxTokens
task-1,"Write a haiku about programming",gpt-3.5-turbo,0.7,100
task-2,"Explain quantum computing",gpt-4,0.5,500
```

### JSONL Format

```jsonl
{"id":"task-1","prompt":"Write a haiku about programming","model":"gpt-3.5-turbo","temperature":0.7,"maxTokens":100}
{"id":"task-2","prompt":"Explain quantum computing","model":"gpt-4","temperature":0.5,"maxTokens":500}
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
TASK_RUNNER_CONFIG=./config/tasks.json
LOG_LEVEL=info

# Optional: Custom OpenAI Base URL (for Azure OpenAI or other providers)
OPENAI_BASE_URL=https://your-custom-endpoint.openai.azure.com/

# Optional: Custom Model
OPENAI_MODEL=gpt-4
```

## Project Structure

```
gpt-task-runner/
├── src/                    # Source code
│   ├── transports/         # API transport implementations
│   ├── io/                # Input/output handling
│   ├── cli.ts             # Command line interface
│   ├── task-runner.ts     # Main task execution logic
│   └── types.ts           # TypeScript type definitions
├── examples/              # Example input files
├── tests/                 # Test files
├── dist/                  # Compiled JavaScript (after build)
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore patterns
├── LICENSE                # License file
└── README.md              # This file
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test
npm test -- dry-run.test.ts
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

1. Check the [Issues](https://github.com/liijamiilmfs/gpt-task-runner/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

## Roadmap

- [x] **Dry-run mode for safe testing** ✅
- [x] **Batch processing with CSV and JSONL** ✅
- [x] **Cost estimation and token usage tracking** ✅
- [ ] Web-based dashboard
- [ ] Task scheduling capabilities
- [ ] Integration with popular CI/CD tools
- [ ] Advanced logging and analytics
- [ ] Multi-model support

---

Made with ❤️ by the GPT Task Runner team