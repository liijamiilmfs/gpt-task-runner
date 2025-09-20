import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { 
      libranText, 
      voice = process.env.OPENAI_TTS_VOICE ?? 'alloy', 
      format = process.env.AUDIO_FORMAT ?? 'mp3'
    } = await request.json()

    if (!libranText || typeof libranText !== 'string') {
      return NextResponse.json(
        { error: 'libranText is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate voice parameter
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    if (!validVoices.includes(voice)) {
      return NextResponse.json(
        { error: 'Invalid voice parameter' },
        { status: 400 }
      )
    }

    // Validate format parameter
    const validFormats = ['mp3', 'wav', 'flac']
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format parameter' },
        { status: 400 }
      )
    }

    // Generate speech using OpenAI TTS
    const client = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY! 
    });
    
    const response = await client.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL ?? 'gpt-4o-mini-tts',
      voice: voice as any,
      input: libranText,
      response_format: format as any,
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Set appropriate headers for audio streaming
    const headers = new Headers()
    const contentType = format === 'mp3' ? 'audio/mpeg' : 
                       format === 'wav' ? 'audio/wav' : 
                       'audio/flac'
    headers.set('Content-Type', contentType)
    headers.set('Content-Length', audioBuffer.length.toString())
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Content-Disposition', `attachment; filename="libran-audio.${format}"`)

    return new NextResponse(audioBuffer, {
      status: 200,
      headers
    })

  } catch (error: any) {
    console.error('TTS error:', error)
    
    // Handle specific OpenAI errors
    if (error.status === 429) {
      return NextResponse.json(
        { 
          error: 'OpenAI quota exceeded. Please check your billing details or try again later.',
          type: 'quota_exceeded',
          details: 'You have exceeded your current OpenAI API quota. Please add credits or upgrade your plan.'
        },
        { status: 429 }
      )
    }
    
    if (error.type === 'insufficient_quota') {
      return NextResponse.json(
        { 
          error: 'OpenAI quota exceeded. Please check your billing details.',
          type: 'quota_exceeded',
          details: 'Your OpenAI account has insufficient quota for this request.'
        },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: 'Speech generation failed' },
      { status: 500 }
    )
  }
}
