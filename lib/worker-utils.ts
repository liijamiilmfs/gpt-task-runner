import path from 'node:path';
import fs from 'node:fs';
import { Worker } from 'node:worker_threads';

/**
 * Resolves the path to a compiled worker file
 * This ensures we always point to a stable filesystem path, not .next paths
 */
export function resolveWorkerPath(workerName: string): string {
  const isDev = process.env.NODE_ENV !== 'production';
  
  // In both dev and prod, use the compiled worker from dist-workers
  const workerPath = path.join(process.cwd(), 'dist-workers', `${workerName}.js`);
  
  // Verify the worker file exists
  if (!fs.existsSync(workerPath)) {
    throw new Error(`Worker file not found: ${workerPath}. Make sure to run 'npm run build:workers' first.`);
  }
  
  return workerPath;
}

/**
 * Creates a worker with proper path resolution
 * This prevents the MODULE_NOT_FOUND error from .next paths
 */
export function createWorker(workerName: string, workerData?: any): Worker {
  const workerPath = resolveWorkerPath(workerName);
  
  console.log(`Creating worker from: ${workerPath}`);
  
  return new Worker(workerPath, {
    workerData,
    // Add any additional worker options here
  });
}

/**
 * Creates a worker with error handling and cleanup
 */
export function createWorkerWithCleanup(
  workerName: string, 
  workerData?: any,
  onMessage?: (data: any) => void,
  onError?: (error: Error) => void
): Worker {
  const worker = createWorker(workerName, workerData);
  
  if (onMessage) {
    worker.on('message', onMessage);
  }
  
  if (onError) {
    worker.on('error', onError);
  }
  
  // Handle worker exit
  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Worker ${workerName} stopped with exit code ${code}`);
    }
  });
  
  return worker;
}

/**
 * Utility to check if workers are properly built
 */
export function verifyWorkersBuilt(): boolean {
  const distWorkersDir = path.join(process.cwd(), 'dist-workers');
  
  if (!fs.existsSync(distWorkersDir)) {
    console.error('dist-workers directory not found. Run "npm run build:workers" first.');
    return false;
  }
  
  return true;
}

/**
 * Get list of available compiled workers
 */
export function getAvailableWorkers(): string[] {
  const distWorkersDir = path.join(process.cwd(), 'dist-workers');
  
  if (!fs.existsSync(distWorkersDir)) {
    return [];
  }
  
  return fs.readdirSync(distWorkersDir)
    .filter(file => file.endsWith('.js'))
    .map(file => file.replace('.js', ''));
}
