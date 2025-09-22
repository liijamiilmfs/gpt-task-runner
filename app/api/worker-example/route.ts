import { NextRequest, NextResponse } from 'next/server';
import { createWorkerWithCleanup, verifyWorkersBuilt } from '@/lib/worker-utils';
import { log, generateCorrelationId } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const requestId = generateCorrelationId();
  
  log.apiRequest('POST', '/api/worker-example', requestId);
  
  try {
    // Verify workers are built
    if (!verifyWorkersBuilt()) {
      return NextResponse.json(
        { error: 'Workers not built. Run "npm run build:workers" first.' },
        { status: 500 }
      );
    }
    
    const { task, data } = await request.json();
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task is required' },
        { status: 400 }
      );
    }
    
    // Create a promise to handle the worker response
    const workerPromise = new Promise((resolve, reject) => {
      const worker = createWorkerWithCleanup(
        'example-worker',
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
      
      // Set a timeout to prevent hanging
      setTimeout(() => {
        worker.terminate();
        reject(new Error('Worker timeout'));
      }, 10000); // 10 second timeout
    });
    
    const result = await workerPromise;
    
    log.apiResponse('POST', '/api/worker-example', 200, 0, requestId);
    
    return NextResponse.json({
      success: true,
      result,
      requestId
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.errorWithContext(error instanceof Error ? error : new Error('Unknown error'), 'WORKER_ERROR', requestId);
    
    return NextResponse.json(
      { 
        error: 'Worker execution failed',
        message: errorMessage,
        requestId 
      },
      { status: 500 }
    );
  }
}
