import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';

const db = new Database();

// PATCH /api/scheduled-tasks/[id]/enable - Enable a scheduled task
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await db.enableScheduledTask(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Scheduled task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Scheduled task enabled successfully',
    });
  } catch (error) {
    console.error('Error enabling scheduled task:', error);
    return NextResponse.json(
      { error: 'Failed to enable scheduled task' },
      { status: 500 }
    );
  }
}
