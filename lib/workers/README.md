# Worker System

This directory contains worker threads that can be used for CPU-intensive tasks in your Next.js application.

## Why Use Workers?

- **Prevent Blocking**: Heavy computations don't block the main thread
- **Better Performance**: Utilize multiple CPU cores
- **Stable Paths**: Avoid `.next` path issues that cause MODULE_NOT_FOUND errors

## How It Works

1. **TypeScript Workers**: Write workers in TypeScript in the `lib/workers/` directory
2. **Compilation**: Workers are compiled to JavaScript in `dist-workers/` using `tsconfig.worker.json`
3. **Stable Paths**: Always load workers from `dist-workers/`, never from `.next/`
4. **Automatic Building**: Workers are built automatically when you run `npm run dev` or `npm run build`

## Creating a New Worker

1. Create a new `.ts` file in `lib/workers/` (e.g., `my-worker.ts`)
2. Use the worker template from `example-worker.ts`
3. Run `npm run build:workers` to compile it
4. Use `createWorkerWithCleanup()` from `lib/worker-utils.ts` to create the worker

## Example Usage

```typescript
import { createWorkerWithCleanup } from '@/lib/worker-utils';

// In your API route or component
const worker = createWorkerWithCleanup(
  'my-worker', // name without .js extension
  { task: 'process', data: myData }, // worker data
  (result) => {
    console.log('Worker result:', result);
    worker.terminate();
  },
  (error) => {
    console.error('Worker error:', error);
    worker.terminate();
  }
);
```

## Worker Template

```typescript
import { parentPort, workerData } from 'worker_threads';

interface WorkerData {
  task: string;
  data: any;
}

interface WorkerResult {
  success: boolean;
  result?: any;
  error?: string;
}

function processTask(data: WorkerData): WorkerResult {
  try {
    // Your processing logic here
    return {
      success: true,
      result: { /* your result */ }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

if (parentPort) {
  parentPort.on('message', (data: WorkerData) => {
    const result = processTask(data);
    parentPort?.postMessage(result);
  });
  
  if (workerData) {
    const result = processTask(workerData as WorkerData);
    parentPort?.postMessage(result);
  }
}
```

## Troubleshooting

### "Worker file not found" Error
- Run `npm run build:workers` to compile workers
- Check that your worker file exists in `lib/workers/`
- Verify the worker name matches the filename (without extension)

### "MODULE_NOT_FOUND" Error
- Never use paths that point to `.next/` directories
- Always use `createWorkerWithCleanup()` or `resolveWorkerPath()`
- Ensure workers are compiled before running the application

### Worker Timeout
- Workers have a 10-second timeout by default
- For longer tasks, increase the timeout in your API route
- Consider breaking large tasks into smaller chunks

## Best Practices

1. **Keep Workers Focused**: Each worker should handle one specific type of task
2. **Handle Errors**: Always include error handling in your workers
3. **Clean Up**: Always call `worker.terminate()` when done
4. **Use Timeouts**: Set reasonable timeouts to prevent hanging
5. **Test Thoroughly**: Test workers in both dev and production environments
