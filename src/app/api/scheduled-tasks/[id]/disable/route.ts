import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';

const db = new Database();

// PATCH /api/scheduled-tasks/[id]/disable - Disable a scheduled task
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await db.disableScheduledTask(params.id);
    if (!success) {
      return NextResponse.json(
        { error: 'Scheduled task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Scheduled task disabled successfully',
    });
  } catch (error) {
    console.error('Error disabling scheduled task:', error);
    return NextResponse.json(
      { error: 'Failed to disable scheduled task' },
      { status: 500 }
    );
  }
}
