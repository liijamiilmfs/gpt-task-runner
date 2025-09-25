import { NextResponse } from 'next/server';
import { Database } from '@/lib/database';

export async function GET() {
  try {
    const db = new Database();

    // Get basic status information
    const status = {
      isRunning: true, // This would come from your service monitoring
      scheduledTasks: 0, // This would come from your scheduler
      metrics: await db.getTaskMetrics(),
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
