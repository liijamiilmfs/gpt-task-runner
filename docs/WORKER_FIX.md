# Worker Thread Fix - MODULE_NOT_FOUND Error

## Problem

Your API route was crashing with:
```
Cannot find module
'C:\...\english-to-libran-text-to-voice\.next\server\vendor-chunks\lib\worker.js'
code: 'MODULE_NOT_FOUND'
```

This happens because:
1. Your code tries to load a worker from a `.next` path
2. In development mode, `.next/server/vendor-chunks/lib/worker.js` doesn't exist
3. Next.js serves files from memory/other locations in dev, not the filesystem

## Root Cause

- **Never target files inside `.next/**` directly**
- Those paths are ephemeral and differ across dev vs build
- Webpack/SWC may externalize workers to "vendor chunks" in production but not in dev

## Solution Implemented

### 1. Worker Build System

**`tsconfig.worker.json`** - Compiles workers to stable paths:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "dist-workers",
    "module": "commonjs",
    "target": "ES2020"
  },
  "include": ["lib/workers/**/*.ts"]
}
```

**`package.json`** - Updated scripts:
```json
{
  "scripts": {
    "dev": "npm run build:workers && next dev",
    "build": "npm run build:workers && next build",
    "build:workers": "tsc -p tsconfig.worker.json"
  }
}
```

### 2. Robust Worker Utilities

**`lib/worker-utils.ts`** - Safe worker creation:
```typescript
import path from 'node:path';
import fs from 'node:fs';
import { Worker } from 'node:worker_threads';

export function resolveWorkerPath(workerName: string): string {
  // Always use dist-workers/, never .next/
  const workerPath = path.join(process.cwd(), 'dist-workers', `${workerName}.js`);
  
  if (!fs.existsSync(workerPath)) {
    throw new Error(`Worker file not found: ${workerPath}. Run 'npm run build:workers' first.`);
  }
  
  return workerPath;
}

export function createWorkerWithCleanup(
  workerName: string, 
  workerData?: any,
  onMessage?: (data: any) => void,
  onError?: (error: Error) => void
): Worker {
  const workerPath = resolveWorkerPath(workerName);
  const worker = new Worker(workerPath, { workerData });
  
  if (onMessage) worker.on('message', onMessage);
  if (onError) worker.on('error', onError);
  
  return worker;
}
```

### 3. Example Usage

**API Route** (`app/api/worker-example/route.ts`):
```typescript
import { createWorkerWithCleanup, verifyWorkersBuilt } from '@/lib/worker-utils';

export async function POST(request: NextRequest) {
  // Verify workers are built
  if (!verifyWorkersBuilt()) {
    return NextResponse.json(
      { error: 'Workers not built. Run "npm run build:workers" first.' },
      { status: 500 }
    );
  }
  
  const { task, data } = await request.json();
  
  // Create worker with proper error handling
  const workerPromise = new Promise((resolve, reject) => {
    const worker = createWorkerWithCleanup(
      'example-worker', // name without .js extension
      { task, data },
      (result) => {
        resolve(result);
        worker.terminate();
      },
      (error) => {
        reject(error);
        worker.terminate();
      }
    );
    
    // Timeout to prevent hanging
    setTimeout(() => {
      worker.terminate();
      reject(new Error('Worker timeout'));
    }, 10000);
  });
  
  const result = await workerPromise;
  return NextResponse.json({ success: true, result });
}
```

## How to Use

### 1. Create a Worker

Create `lib/workers/my-worker.ts`:
```typescript
import { parentPort, workerData } from 'worker_threads';

interface WorkerData {
  task: string;
  data: any;
}

function processTask(data: WorkerData) {
  // Your heavy computation here
  return { success: true, result: 'processed' };
}

if (parentPort) {
  parentPort.on('message', (data: WorkerData) => {
    const result = processTask(data);
    parentPort?.postMessage(result);
  });
}
```

### 2. Build Workers

```bash
npm run build:workers
```

This creates `dist-workers/my-worker.js`.

### 3. Use in API Route

```typescript
import { createWorkerWithCleanup } from '@/lib/worker-utils';

const worker = createWorkerWithCleanup('my-worker', { task: 'process', data });
```

## Key Benefits

1. **Stable Paths**: Always use `dist-workers/`, never `.next/`
2. **Works in Dev & Prod**: Same behavior in both environments
3. **Error Handling**: Clear error messages when workers aren't built
4. **Automatic Building**: Workers built automatically with `npm run dev`
5. **Type Safety**: Full TypeScript support for workers

## Troubleshooting

### "Worker file not found"
- Run `npm run build:workers`
- Check worker exists in `lib/workers/`
- Verify worker name matches filename

### "MODULE_NOT_FOUND"
- Never use `.next/` paths
- Always use `createWorkerWithCleanup()`
- Ensure workers are compiled first

### Worker Timeout
- Increase timeout in your API route
- Break large tasks into smaller chunks
- Add progress reporting

## Migration Guide

If you have existing worker code:

1. **Move workers** to `lib/workers/`
2. **Replace** `new Worker(path)` with `createWorkerWithCleanup(name)`
3. **Update paths** to use worker names instead of file paths
4. **Add** `npm run build:workers` to your build process
5. **Test** in both dev and production

This solution eliminates the MODULE_NOT_FOUND error and provides a robust, maintainable worker system.
