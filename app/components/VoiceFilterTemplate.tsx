'use client'

import { useState } from 'react'
import { Copy, Download, Upload, FileText } from 'lucide-react'
import { createVoiceFilter, validateVoiceFilter, type VoiceFilter } from '@/lib/dynamic-voice-filter'

export default function VoiceFilterTemplate() {
  const [template, setTemplate] = useState('')
  const [jsonInput, setJsonInput] = useState('')
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null)

  // Generate template from prompt
  const generateTemplate = () => {
    if (!template.trim()) return

    const filter = createVoiceFilter(template)
    const jsonTemplate = JSON.stringify(filter, null, 2)
    setJsonInput(jsonTemplate)
    setValidationResult({ valid: true, message: 'Template generated successfully!' })
  }

  // Validate JSON input
  const validateJson = () => {
    if (!jsonInput.trim()) {
      setValidationResult({ valid: false, message: 'Please enter JSON data' })
      return
    }

    try {
      const parsed = JSON.parse(jsonInput)
      const validated = validateVoiceFilter(parsed)
      
      if (validated) {
        setValidationResult({ valid: true, message: 'JSON is valid!' })
      } else {
        setValidationResult({ valid: false, message: 'JSON is invalid - missing required fields or invalid values' })
      }
    } catch (error) {
      setValidationResult({ valid: false, message: 'Invalid JSON format' })
    }
  }

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonInput)
    setValidationResult({ valid: true, message: 'Copied to clipboard!' })
  }

  // Download as file
  const downloadTemplate = () => {
    const blob = new Blob([jsonInput], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'voice-filter-template.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Load from file
  const loadFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setJsonInput(content)
      validateJson()
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      {/* Generate from Prompt */}
      <div className="bg-libran-dark border border-libran-gold/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 text-libran-gold flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Generate Template from Prompt</span>
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enter a voice description:
            </label>
            <input
              type="text"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="e.g., 'deep, mysterious, ancient voice with ceremonial authority'"
              className="w-full px-3 py-2 bg-libran-dark border border-libran-accent rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-libran-gold focus:border-transparent"
            />
          </div>
          
          <button
            onClick={generateTemplate}
            disabled={!template.trim()}
            className="px-4 py-2 bg-libran-gold text-libran-dark rounded-lg hover:bg-libran-gold/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Template
          </button>
        </div>
      </div>

      {/* JSON Editor */}
      <div className="bg-libran-dark border border-libran-gold/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 text-libran-gold">Voice Filter JSON Template</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              JSON Template:
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste your voice filter JSON here..."
              className="w-full h-40 px-3 py-2 bg-libran-dark border border-libran-accent rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-libran-gold focus:border-transparent font-mono text-sm resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={validateJson}
              className="px-4 py-2 bg-libran-accent/20 border border-libran-accent rounded-lg text-white hover:bg-libran-accent/40 transition-colors"
            >
              Validate JSON
            </button>
            
            <button
              onClick={copyToClipboard}
              disabled={!jsonInput.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-libran-accent/20 border border-libran-accent rounded-lg text-white hover:bg-libran-accent/40 transition-colors disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
            
            <button
              onClick={downloadTemplate}
              disabled={!jsonInput.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-libran-accent/20 border border-libran-accent rounded-lg text-white hover:bg-libran-accent/40 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            
            <label className="flex items-center space-x-2 px-4 py-2 bg-libran-accent/20 border border-libran-accent rounded-lg text-white hover:bg-libran-accent/40 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Load File</span>
              <input
                type="file"
                accept=".json"
                onChange={loadFromFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className={`p-3 rounded-lg ${
              validationResult.valid 
                ? 'bg-green-900/20 border border-green-500/30 text-green-300'
                : 'bg-red-900/20 border border-red-500/30 text-red-300'
            }`}>
              {validationResult.message}
            </div>
          )}
        </div>
      </div>

      {/* Format Documentation */}
      <div className="bg-libran-dark border border-libran-gold/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 text-libran-gold">Voice Filter Format</h3>
        
        <div className="space-y-3 text-sm text-gray-300">
          <div>
            <h4 className="font-medium text-white mb-2">Required Fields:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code className="text-libran-gold">id</code> - Unique identifier (string)</li>
              <li><code className="text-libran-gold">name</code> - Display name (string)</li>
              <li><code className="text-libran-gold">prompt</code> - Original voice description (string)</li>
              <li><code className="text-libran-gold">characteristics</code> - Voice parameters (object)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-2">Characteristics Object:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>pitch: 0.5 - 2.0</div>
              <div>speed: 0.5 - 2.0</div>
              <div>volume: 0.1 - 1.0</div>
              <div>emphasis: 0.1 - 1.0</div>
              <div>warmth: 0.0 - 1.0</div>
              <div>authority: 0.0 - 1.0</div>
              <div>mystery: 0.0 - 1.0</div>
              <div>energy: 0.0 - 1.0</div>
              <div>formality: 0.0 - 1.0</div>
              <div>ancientness: 0.0 - 1.0</div>
              <div>solemnity: 0.0 - 1.0</div>
              <div>pauseLength: 0.5 - 2.0</div>
              <div>breathiness: 0.0 - 1.0</div>
              <div>clarity: 0.0 - 1.0</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-2">Optional Fields:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code className="text-libran-gold">createdAt</code> - Creation date (ISO string)</li>
              <li><code className="text-libran-gold">lastUsed</code> - Last usage date (ISO string)</li>
              <li><code className="text-libran-gold">useCount</code> - Usage counter (number)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
