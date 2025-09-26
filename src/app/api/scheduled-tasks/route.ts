import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { ScheduledTask } from '@/types';
import { validateScheduledTask } from '@/utils/schedule-validator';

const db = new Database();

// GET /api/scheduled-tasks - List all scheduled tasks
export async function GET() {
  try {
    const tasks = await db.getScheduledTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching scheduled tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled tasks' },
      { status: 500 }
    );
  }
}

// POST /api/scheduled-tasks - Create a new scheduled task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const task: ScheduledTask = body;

    // Validate the task
    const validation = validateScheduledTask(task);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Save the task
    const savedTask = await db.saveScheduledTask(
      task as unknown as Record<string, unknown>
    );
    return NextResponse.json(savedTask, { status: 201 });
  } catch (error) {
    console.error('Error creating scheduled task:', error);
    return NextResponse.json(
      { error: 'Failed to create scheduled task' },
      { status: 500 }
    );
  }
}
