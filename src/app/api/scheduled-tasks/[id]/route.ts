import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { ScheduledTask } from '@/types';
import { validateScheduledTask } from '@/utils/schedule-validator';

const db = new Database();

// GET /api/scheduled-tasks/[id] - Get a specific scheduled task
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await db.getScheduledTask(id);
    if (!task) {
      return NextResponse.json(
        { error: 'Scheduled task not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching scheduled task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled task' },
      { status: 500 }
    );
  }
}

// PUT /api/scheduled-tasks/[id] - Update a scheduled task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const task: ScheduledTask = { ...body, id };

    // Validate the task
    const validation = validateScheduledTask(task);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Update the task
    const updatedTask = await db.updateScheduledTask(
      id,
      task as unknown as Record<string, unknown>
    );
    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Scheduled task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating scheduled task:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduled task' },
      { status: 500 }
    );
  }
}

// DELETE /api/scheduled-tasks/[id] - Delete a scheduled task
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await db.deleteScheduledTask(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Scheduled task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Scheduled task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting scheduled task:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduled task' },
      { status: 500 }
    );
  }
}
