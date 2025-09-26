# Development Guide

## Overview

This guide provides comprehensive instructions for developers working on the GPT Task Runner project. It covers setup, development workflow, testing, debugging, and contribution guidelines.

## Prerequisites

### System Requirements
- **Node.js**: Version 20.17.0 or higher
- **npm**: Version 10.0.0 or higher
- **Git**: Version 2.34.0 or higher
- **Operating System**: Linux, macOS, or Windows (WSL2 recommended for Windows)

### Development Tools
- **Code Editor**: VS Code, IntelliJ IDEA, or similar with TypeScript support
- **Git Client**: Command line or GUI client
- **Docker**: For containerized development (optional)
- **Redis**: For caching during development (optional)

### Required Accounts
- **OpenAI API Key**: For AI model integration
- **GitHub Account**: For code contributions

## Quick Start

### 1. Environment Setup

**Clone the Repository:**
```bash
git clone https://github.com/your-org/gpt-task-runner.git
cd gpt-task-runner
```

**Install Dependencies:**
```bash
npm install
```

**Environment Configuration:**
```bash
# Copy environment template
cp .env.example .env

# Edit with your configuration
vim .env
```

**Required Environment Variables:**
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database
DATABASE_URL=./data/tasks.db

# Development
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000

# Optional
REDIS_URL=redis://localhost:6379
```

### 2. Development Server

**Start Development Server:**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

**Available Scripts:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### 3. Initial Testing

**Run Test Suite:**
```bash
npm test
```

**Run with Coverage:**
```bash
npm run test:coverage
```

**View Coverage Report:**
```bash
npm run test:coverage
# Open coverage/lcov-report/index.html in browser
```

## Development Workflow

### Branch Strategy

We follow a structured branching strategy:

```
main                    # Production-ready code
├── develop            # Integration branch for features
├── release/x.x.x      # Release preparation branches
├── feature/*          # New features (short-lived)
├── fix/*             # Bug fixes
├── chore/*           # Maintenance and refactoring
└── hotfix/*          # Critical production fixes
```

**Creating Feature Branches:**
```bash
# Feature branch
git checkout -b feature/add-user-authentication

# Bug fix branch
git checkout -b fix/database-connection-leak

# Maintenance branch
git checkout -b chore/update-dependencies
```

### Code Style & Standards

**Prettier Configuration:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

**ESLint Rules:**
- No unused variables (with warnings)
- Consistent import/export patterns
- TypeScript strict mode
- React hooks rules

**Code Formatting:**
```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

### Commit Conventions

We follow [Conventional Commits](https://conventionalcommits.org/) specification:

```
feat: add user authentication system
fix: resolve database connection timeout
docs: update API documentation
style: format code according to guidelines
refactor: extract user service logic
test: add unit tests for authentication
chore: update dependencies
```

**Commit Message Format:**
```bash
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code restructuring
- `test`: Test additions/changes
- `chore`: Maintenance tasks

### Pull Request Process

**1. Create Pull Request:**
```bash
# Ensure branch is up to date
git fetch origin
git rebase origin/develop

# Push feature branch
git push origin feature/your-feature-name
```

**2. PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] feat: New feature
- [ ] fix: Bug fix
- [ ] docs: Documentation
- [ ] style: Code style
- [ ] refactor: Refactoring
- [ ] test: Tests
- [ ] chore: Maintenance

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] All tests pass

## Checklist
- [ ] Code follows project standards
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Documentation updated
- [ ] Breaking changes documented
```

**3. Code Review Process:**
- At least one approval required
- All CI checks must pass
- Code coverage requirements met
- Security scan passed

### 4. Merge Process

**Squash and Merge:**
- Use "Squash and merge" for feature branches
- Create meaningful commit messages
- Reference issue numbers in commit messages

**Merge Commit:**
- Use "Merge commit" for release branches
- Preserve merge history
- Include release notes

## Project Structure

### Understanding the Codebase

```
src/
├── core/                    # Core business logic
│   ├── task-manager/        # Task execution engine
│   ├── scheduler/           # Scheduling system
│   ├── database/            # Data access layer
│   └── transport/           # External integrations
├── cli/                     # Command-line interface
├── api/                     # REST API endpoints
├── web/                     # Next.js web interface
├── shared/                  # Shared utilities
│   ├── types/               # TypeScript definitions
│   ├── utils/               # Utility functions
│   ├── constants/           # Application constants
│   └── validation/          # Validation schemas
└── infrastructure/          # Infrastructure concerns
    ├── logging/             # Logging configuration
    ├── metrics/             # Metrics collection
    ├── config/              # Configuration management
    └── monitoring/          # Monitoring setup
```

### Key Architecture Patterns

**1. Repository Pattern:**
```typescript
// Repository interface
interface TaskRepository {
  findById(id: string): Promise<Task | null>;
  findByBatchId(batchId: string): Promise<Task[]>;
  save(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
}

// Implementation
class SQLiteTaskRepository implements TaskRepository {
  async findById(id: string): Promise<Task | null> {
    // Implementation
  }
}
```

**2. Service Layer Pattern:**
```typescript
class TaskService {
  constructor(
    private taskRepository: TaskRepository,
    private eventPublisher: EventPublisher
  ) {}

  async executeTask(taskId: string): Promise<TaskResult> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new TaskNotFoundError(taskId);
    }

    const result = await this.processTask(task);
    await this.eventPublisher.publish('task.completed', { taskId, result });

    return result;
  }
}
```

**3. Dependency Injection:**
```typescript
// Dependency container
const container = new Container();

container.register('TaskRepository', SQLiteTaskRepository);
container.register('TaskService', TaskService);

// Usage
const taskService = container.resolve('TaskService');
```

## Testing Strategy

### Test Organization

```
tests/
├── unit/                    # Unit tests
│   ├── core/                # Core logic tests
│   ├── cli/                 # CLI command tests
│   └── shared/              # Utility tests
├── integration/             # Integration tests
│   ├── api/                 # API endpoint tests
│   ├── database/            # Database integration
│   └── external/            # External service tests
├── e2e/                     # End-to-end tests
│   ├── workflows/           # Complete workflows
│   └── scenarios/           # User scenarios
└── fixtures/                # Test data
    ├── tasks.json           # Sample tasks
    ├── batches.csv          # Sample batches
    └── users.json           # Sample users
```

### Writing Tests

**Unit Test Example:**
```typescript
describe('TaskService', () => {
  let taskService: TaskService;
  let mockRepository: MockTaskRepository;

  beforeEach(() => {
    mockRepository = new MockTaskRepository();
    taskService = new TaskService(mockRepository);
  });

  describe('executeTask', () => {
    it('should execute a valid task successfully', async () => {
      const task = createTestTask();
      mockRepository.save(task);

      const result = await taskService.executeTask(task.id);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });

    it('should throw error for non-existent task', async () => {
      await expect(taskService.executeTask('invalid-id'))
        .rejects.toThrow(TaskNotFoundError);
    });
  });
});
```

**Integration Test Example:**
```typescript
describe('Task API', () => {
  let app: Express;
  let db: Database;

  beforeAll(async () => {
    db = await setupTestDatabase();
    app = await setupTestApp();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('POST /api/v1/tasks', () => {
    it('should create task successfully', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .send({
          id: 'test-task',
          prompt: 'Test prompt',
          model: 'gpt-3.5-turbo'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('test-task');
    });
  });
});
```

**Test Utilities:**
```typescript
// Test helpers
export const createTestTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'test-task-' + Date.now(),
  prompt: 'Test prompt',
  model: 'gpt-3.5-turbo',
  status: 'pending',
  createdAt: new Date(),
  ...overrides
});

export const setupTestDatabase = async (): Promise<Database> => {
  const db = new Database(':memory:');
  await db.migrate();
  return db;
};
```

### Running Tests

**All Tests:**
```bash
npm test
```

**Specific Test Suites:**
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e
```

**Test with Coverage:**
```bash
npm run test:coverage
```

**Test Debugging:**
```bash
# Run specific test file
npm test -- task-service.test.ts

# Run with debug output
DEBUG=test:* npm test
```

## Debugging

### Development Debugging

**1. VS Code Debugging:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Application",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["run"],
      "console": "integratedTerminal"
    }
  ]
}
```

**2. Node.js Debugging:**
```bash
# Debug with inspector
node --inspect src/index.ts

# Debug with breakpoints
node --inspect-brk src/index.ts
```

**3. Chrome DevTools:**
```bash
# Enable remote debugging
npm run dev -- --inspect
```

### Common Debugging Scenarios

**Database Issues:**
```bash
# Check database file
ls -la data/

# Inspect database content
sqlite3 data/tasks.db ".schema"
sqlite3 data/tasks.db "SELECT * FROM tasks LIMIT 5;"
```

**API Issues:**
```bash
# Test API endpoints
curl http://localhost:3000/api/v1/status

# Check API logs
tail -f logs/app.log | grep "api"
```

**Performance Issues:**
```bash
# Profile memory usage
node --prof src/index.ts

# Profile CPU usage
node --cpu-prof src/index.ts
```

## Code Quality

### Linting & Formatting

**Automated Checks:**
```bash
# Run all quality checks
npm run check

# Individual checks
npm run lint          # ESLint
npm run type-check    # TypeScript
npm run format:check  # Prettier
npm run test          # Tests
```

**Pre-commit Hooks:**
```bash
# Install hooks
npx husky install

# The hooks will run automatically on git commit
```

**Manual Formatting:**
```bash
# Format specific files
npx prettier --write src/components/TaskForm.tsx

# Check specific files
npx prettier --check src/**/*.ts
```

### Code Coverage Requirements

**Minimum Coverage Thresholds:**
- **Overall**: 90%
- **Core Business Logic**: 95%
- **Utilities**: 85%
- **API Handlers**: 90%

**Coverage Commands:**
```bash
# Generate coverage report
npm run test:coverage

# Check coverage thresholds
npm run test:coverage -- --reporter=verbose

# Open HTML report
open coverage/lcov-report/index.html
```

## Documentation

### Documentation Standards

**Code Documentation:**
```typescript
/**
 * Executes a task using the specified transport
 * @param taskId - Unique identifier for the task
 * @param options - Execution options
 * @returns Promise resolving to task result
 * @throws {TaskNotFoundError} When task doesn't exist
 * @throws {ExecutionError} When task execution fails
 */
async executeTask(
  taskId: string,
  options: TaskExecutionOptions
): Promise<TaskResult> {
  // Implementation
}
```

**README Files:**
- Every module should have a README.md
- Include setup instructions, API documentation, and examples
- Keep documentation in sync with code changes

### Generating Documentation

**API Documentation:**
```bash
# Generate TypeDoc documentation
npm run docs:api

# Generate JSDoc documentation
npm run docs:jsdoc
```

**Architecture Documentation:**
- Update architecture docs when making structural changes
- Include diagrams for complex workflows
- Document design decisions and trade-offs

## Performance Optimization

### Development Performance

**Bundle Analysis:**
```bash
# Analyze bundle size
npm run build -- --analyze

# Check for duplicate dependencies
npm run build -- --duplicates
```

**Hot Module Replacement:**
```bash
# Enable HMR in development
npm run dev -- --hot
```

**Development Server Options:**
```bash
# Faster builds
npm run dev -- --turbo

# Disable source maps in development
npm run dev -- --no-sourcemap
```

### Database Optimization

**Query Optimization:**
```sql
-- Add indexes for common queries
CREATE INDEX idx_tasks_status_created ON tasks(status, created_at);
CREATE INDEX idx_tasks_batch_id ON tasks(batch_id);

-- Analyze query performance
EXPLAIN QUERY PLAN SELECT * FROM tasks WHERE status = 'pending' ORDER BY created_at;
```

**Connection Pooling:**
```typescript
const pool = new DatabasePool({
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Security in Development

### Secure Development Practices

**Environment Variables:**
```bash
# Never commit secrets
git status  # Check for .env files
git rm --cached .env  # Remove if accidentally added

# Use environment-specific values
cp .env.example .env.local
```

**API Key Management:**
```bash
# Store in environment, not code
export OPENAI_API_KEY="your-key-here"

# Use different keys for different environments
export OPENAI_API_KEY_DEV="dev-key"
export OPENAI_API_KEY_PROD="prod-key"
```

**Input Validation:**
```typescript
// Always validate input
const validateTaskInput = (input: unknown): TaskInput => {
  const schema = Joi.object({
    id: Joi.string().required(),
    prompt: Joi.string().required(),
    model: Joi.string().valid('gpt-3.5-turbo', 'gpt-4'),
  });

  return schema.validate(input);
};
```

## Troubleshooting

### Common Development Issues

**1. Port Already in Use:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

**2. Module Not Found:**
```bash
# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
```

**3. TypeScript Errors:**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update dependencies
npm run type-check
```

**4. Test Failures:**
```bash
# Run specific failing test
npm test -- --reporter=verbose task-service.test.ts

# Debug test
npm test -- --inspect task-service.test.ts
```

**5. Database Connection Issues:**
```bash
# Check database file
ls -la data/

# Reset database
rm data/tasks.db
npm run dev
```

## Getting Help

### Development Resources

**Documentation:**
- [Project Documentation](docs/README.md)
- [API Reference](docs/api/README.md)
- [Architecture Guide](docs/architecture/README.md)

**Community:**
- [GitHub Issues](https://github.com/your-org/gpt-task-runner/issues)
- [Discussion Forum](https://forum.gpt-task-runner.io)
- [Discord Chat](https://discord.gg/gpt-task-runner)

**Code Examples:**
```bash
# Example implementations
examples/

# Test fixtures
tests/fixtures/
```

### Reporting Issues

**Bug Reports:**
```markdown
## Bug Description
[Describe the bug]

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- OS: [e.g. macOS 12.1]
- Node.js: [e.g. 18.12.0]
- Browser: [e.g. Chrome 107]

## Additional Context
[Additional information]
```

**Feature Requests:**
```markdown
## Feature Description
[Describe the feature]

## Use Case
[Why is this feature needed?]

## Proposed Solution
[How should it work?]

## Alternatives Considered
[Other approaches considered]

## Additional Context
[Additional information]
```

## Contributing Guidelines

### Before Contributing

1. **Check Existing Issues:** Look for similar issues or feature requests
2. **Create Issue:** Discuss your changes before implementing
3. **Fork Repository:** Create your own fork for development
4. **Set Up Environment:** Follow the development setup guide
5. **Create Branch:** Use appropriate branch naming convention

### Contribution Process

1. **Make Changes:** Implement your feature or fix
2. **Write Tests:** Add comprehensive tests
3. **Update Documentation:** Update relevant documentation
4. **Run Quality Checks:** Ensure all checks pass
5. **Create Pull Request:** Submit your changes for review
6. **Code Review:** Address review comments
7. **Merge:** Your changes get merged into main branch

### Code Style Guidelines

**TypeScript:**
```typescript
// Good
interface User {
  readonly id: string;
  name: string;
  email?: string;
}

const createUser = (userData: Partial<User>): User => {
  return {
    id: generateId(),
    name: userData.name ?? 'Anonymous',
    email: userData.email,
  };
};

// Avoid
const user = { id: '1', name: 'John', email: 'john@example.com' };
```

**React Components:**
```typescript
// Good
interface TaskFormProps {
  onSubmit: (task: TaskData) => void;
  initialData?: Partial<TaskData>;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  onSubmit,
  initialData,
}) => {
  // Component logic
};

// Avoid
const TaskForm = ({ onSubmit, initialData }) => {
  // Component logic
};
```

**Error Handling:**
```typescript
// Good
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    throw new TaskValidationError(error.message);
  }
  throw new TaskExecutionError('Failed to execute task', { cause: error });
}

// Avoid
try {
  const result = await riskyOperation();
} catch (e) {
  throw e;
}
```

## Next Steps

After setting up your development environment:

1. **Explore the Codebase:** Review key files and architecture
2. **Run Tests:** Ensure everything works correctly
3. **Make Small Changes:** Start with simple bug fixes or documentation
4. **Tackle Features:** Work on assigned issues or propose new features
5. **Join Community:** Participate in discussions and code reviews

---

**Happy coding! 🎉**