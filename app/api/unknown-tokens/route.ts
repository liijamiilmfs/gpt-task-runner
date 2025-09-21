import { NextRequest, NextResponse } from 'next/server';
import { unknownTokenLogger } from '@/lib/unknown-token-logger';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'list':
        const tokens = await unknownTokenLogger.getUnknownTokens();
        return NextResponse.json({ 
          success: true, 
          data: tokens,
          count: tokens.length 
        });
        
      case 'frequency':
        const frequency = await unknownTokenLogger.getTokenFrequency();
        return NextResponse.json({ 
          success: true, 
          data: frequency 
        });
        
      case 'clear':
        await unknownTokenLogger.clearLog();
        return NextResponse.json({ 
          success: true, 
          message: 'Unknown tokens log cleared' 
        });
        
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Use: list, frequency, or clear' 
        }, { status: 400 });
    }
  } catch (error) {
    log.error('Unknown tokens API error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, variant, context, userAgent, sessionId } = body;
    
    if (!token || !variant) {
      return NextResponse.json({ 
        success: false, 
        error: 'Token and variant are required' 
      }, { status: 400 });
    }
    
    await unknownTokenLogger.logUnknownToken({
      token,
      variant,
      context,
      userAgent,
      sessionId
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Token logged successfully' 
    });
  } catch (error) {
    log.error('Unknown tokens API error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
