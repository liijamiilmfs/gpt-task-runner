import { Database } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

const db = new Database();

// GET /api/tasks - List all task executions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    let tasks = await db.getTaskExecutions(limit, offset);

    // Filter by status if provided
    if (status) {
      tasks = tasks.filter((task) => task.status === status);
    }

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        limit,
        offset,
        total: tasks.length,
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'E_FETCH_TASKS',
          message: 'Failed to fetch tasks',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task execution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.request) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'E_VALIDATION',
            message: 'Request data is required',
            details: 'The request field must contain the task request data',
          },
        },
        { status: 400 }
      );
    }

    const taskExecution = {
      request: JSON.stringify(body.request),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      isDryRun: body.isDryRun || false,
      ...(body.description && { description: body.description }),
    };

    const savedTask = await db.saveTaskExecution(taskExecution);

    return NextResponse.json(
      {
        success: true,
        data: savedTask,
        message: 'Task created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'E_CREATE_TASK',
          message: 'Failed to create task',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}
