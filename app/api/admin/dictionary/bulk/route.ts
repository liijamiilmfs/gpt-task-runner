import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface BulkOperationRequest {
  operation: string
  entries: string[]
  data?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkOperationRequest = await request.json()
    const { operation, entries, data } = body

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No entries specified' },
        { status: 400 }
      )
    }

    // Load current dictionary
    const dictionaryPath = join(process.cwd(), 'data', 'UnifiedLibranDictionaryv1.7.0.json')
    const dictionaryData = JSON.parse(readFileSync(dictionaryPath, 'utf-8'))

    let modified = false

    switch (operation) {
      case 'add_category':
        if (!data?.category) {
          return NextResponse.json(
            { success: false, error: 'Category required' },
            { status: 400 }
          )
        }
        modified = await addCategoryToEntries(dictionaryData, entries, data.category)
        break

      case 'add_tags':
        if (!data?.tags || !Array.isArray(data.tags)) {
          return NextResponse.json(
            { success: false, error: 'Tags array required' },
            { status: 400 }
          )
        }
        modified = await addTagsToEntries(dictionaryData, entries, data.tags)
        break

      case 'export':
        return await exportEntries(dictionaryData, entries)

      case 'delete':
        modified = await deleteEntries(dictionaryData, entries)
        break

      case 'update_notes':
        if (!data?.notes) {
          return NextResponse.json(
            { success: false, error: 'Notes required' },
            { status: 400 }
          )
        }
        modified = await updateNotesForEntries(dictionaryData, entries, data.notes)
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid operation' },
          { status: 400 }
        )
    }

    // Save changes if modified
    if (modified) {
      // Create backup
      const backupPath = dictionaryPath.replace('.json', `.backup.${Date.now()}.json`)
      writeFileSync(backupPath, JSON.stringify(dictionaryData, null, 2))
      
      // Update metadata
      dictionaryData.metadata.last_modified = new Date().toISOString()
      
      // Save updated dictionary
      writeFileSync(dictionaryPath, JSON.stringify(dictionaryData, null, 2))
    }

    return NextResponse.json({
      success: true,
      message: `Bulk operation '${operation}' completed successfully`,
      entries_processed: entries.length,
      modified
    })

  } catch (error) {
    console.error('Bulk operation failed:', error)
    return NextResponse.json(
      { success: false, error: 'Bulk operation failed' },
      { status: 500 }
    )
  }
}

async function addCategoryToEntries(dictionaryData: any, entries: string[], category: string): Promise<boolean> {
  let modified = false

  if (dictionaryData.sections) {
    Object.values(dictionaryData.sections).forEach((section: any) => {
      if (section.data && Array.isArray(section.data)) {
        section.data.forEach((entry: any) => {
          if (entries.includes(entry.english)) {
            entry.category = category
            entry.section = category
            modified = true
          }
        })
      }
    })
  }

  return modified
}

async function addTagsToEntries(dictionaryData: any, entries: string[], tags: string[]): Promise<boolean> {
  let modified = false

  if (dictionaryData.sections) {
    Object.values(dictionaryData.sections).forEach((section: any) => {
      if (section.data && Array.isArray(section.data)) {
        section.data.forEach((entry: any) => {
          if (entries.includes(entry.english)) {
            if (!entry.tags) entry.tags = []
            const existingTags = entry.tags || []
            const combinedTags = [...existingTags, ...tags]
            entry.tags = Array.from(new Set(combinedTags)) // Remove duplicates
            modified = true
          }
        })
      }
    })
  }

  return modified
}

async function updateNotesForEntries(dictionaryData: any, entries: string[], notes: string): Promise<boolean> {
  let modified = false

  if (dictionaryData.sections) {
    Object.values(dictionaryData.sections).forEach((section: any) => {
      if (section.data && Array.isArray(section.data)) {
        section.data.forEach((entry: any) => {
          if (entries.includes(entry.english)) {
            entry.notes = notes
            modified = true
          }
        })
      }
    })
  }

  return modified
}

async function deleteEntries(dictionaryData: any, entries: string[]): Promise<boolean> {
  let modified = false

  if (dictionaryData.sections) {
    Object.keys(dictionaryData.sections).forEach(sectionName => {
      const section = dictionaryData.sections[sectionName]
      if (section.data && Array.isArray(section.data)) {
        const originalLength = section.data.length
        section.data = section.data.filter((entry: any) => !entries.includes(entry.english))
        if (section.data.length !== originalLength) {
          modified = true
        }
      }
    })
  }

  return modified
}

async function exportEntries(dictionaryData: any, entries: string[]): Promise<NextResponse> {
  const exportedEntries: any[] = []

  if (dictionaryData.sections) {
    Object.values(dictionaryData.sections).forEach((section: any) => {
      if (section.data && Array.isArray(section.data)) {
        section.data.forEach((entry: any) => {
          if (entries.includes(entry.english)) {
            exportedEntries.push(entry)
          }
        })
      }
    })
  }

  const exportData = {
    metadata: {
      export_date: new Date().toISOString(),
      exported_entries: exportedEntries.length,
      source_dictionary: 'UnifiedLibranDictionaryv1.7.0.json'
    },
    entries: exportedEntries
  }

  return NextResponse.json({
    success: true,
    message: 'Export completed successfully',
    data: exportData
  })
}
