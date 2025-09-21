import { NextRequest, NextResponse } from 'next/server';
import { ttsCache } from '@/lib/tts-cache';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = await ttsCache.getCacheStats();
        return NextResponse.json({ success: true, data: stats });

      case 'entries':
        const entries = await ttsCache.getCacheEntries();
        return NextResponse.json({ success: true, data: entries, count: entries.length });

      case 'clear':
        await ttsCache.clearCache();
        return NextResponse.json({ success: true, message: 'TTS cache cleared successfully' });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action. Use: stats, entries, or clear' }, { status: 400 });
    }
  } catch (error) {
    log.error('TTS cache API error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ttsCache.clearCache();
    return NextResponse.json({ success: true, message: 'TTS cache cleared successfully' });
  } catch (error) {
    log.error('TTS cache clear error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to clear cache' }, { status: 500 });
  }
}
