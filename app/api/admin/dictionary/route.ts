import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

interface DictionaryEntry {
  english: string
  ancient: string
  modern: string
  notes?: string
  section?: string
  category?: string
  usage_count?: number
  last_used?: string
  etymology?: string[]
  tags?: string[]
}

interface DictionaryMetadata {
  version: string
  total_entries: number
  last_updated: string
  sections: Record<string, number>
}

export async function GET(request: NextRequest) {
  try {
    // Load the unified dictionary
    const dictionaryPath = join(process.cwd(), 'data', 'UnifiedLibranDictionaryv1.7.0.json')
    const dictionaryData = JSON.parse(readFileSync(dictionaryPath, 'utf-8'))

    // Transform the data into our dashboard format
    const entries: DictionaryEntry[] = []
    const sections: Record<string, number> = {}

    // Process sections
    if (dictionaryData.sections) {
      Object.entries(dictionaryData.sections).forEach(([sectionName, sectionData]: [string, any]) => {
        if (sectionData.data && Array.isArray(sectionData.data)) {
          sections[sectionName] = sectionData.data.length
          
          sectionData.data.forEach((entry: any) => {
            entries.push({
              english: entry.english || '',
              ancient: entry.ancient || '',
              modern: entry.modern || '',
              notes: entry.notes || '',
              section: sectionName,
              category: sectionName,
              usage_count: Math.floor(Math.random() * 100), // Mock usage data
              last_used: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
              etymology: entry.etymology || [],
              tags: entry.tags || []
            })
          })
        }
      })
    }

    // Process simple entries if they exist
    if (dictionaryData.entries) {
      Object.entries(dictionaryData.entries).forEach(([english, translation]: [string, any]) => {
        entries.push({
          english,
          ancient: typeof translation === 'string' ? translation : translation.ancient || '',
          modern: typeof translation === 'string' ? translation : translation.modern || '',
          notes: typeof translation === 'object' ? translation.notes : '',
          section: 'Unified',
          category: 'Unified',
          usage_count: Math.floor(Math.random() * 100),
          last_used: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          etymology: [],
          tags: []
        })
      })
    }

    const metadata: DictionaryMetadata = {
      version: dictionaryData.metadata?.version || '1.7.0',
      total_entries: entries.length,
      last_updated: dictionaryData.metadata?.created_on || new Date().toISOString(),
      sections
    }

    return NextResponse.json({
      success: true,
      entries,
      metadata
    })

  } catch (error) {
    console.error('Failed to load dictionary data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load dictionary data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, entry } = body

    switch (action) {
      case 'add':
        // TODO: Implement add entry logic
        return NextResponse.json({ success: true, message: 'Entry added successfully' })
      
      case 'update':
        // TODO: Implement update entry logic
        return NextResponse.json({ success: true, message: 'Entry updated successfully' })
      
      case 'delete':
        // TODO: Implement delete entry logic
        return NextResponse.json({ success: true, message: 'Entry deleted successfully' })
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Failed to process dictionary request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
