'use client'

import { useState } from 'react'
import { X, Save, Trash2, Tag, Folder, FileText, Download } from 'lucide-react'

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  onSave: (operation: string, data: any) => void
}

export default function BulkEditModal({ isOpen, onClose, selectedCount, onSave }: BulkEditModalProps) {
  const [activeTab, setActiveTab] = useState<'category' | 'tags' | 'notes' | 'export'>('category')
  const [formData, setFormData] = useState({
    category: '',
    tags: '',
    notes: '',
    exportFormat: 'json'
  })

  if (!isOpen) return null

  const handleSave = () => {
    let operation = ''
    let data: any = {}

    switch (activeTab) {
      case 'category':
        if (!formData.category.trim()) return
        operation = 'add_category'
        data = { category: formData.category.trim() }
        break
      case 'tags':
        if (!formData.tags.trim()) return
        operation = 'add_tags'
        data = { tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) }
        break
      case 'notes':
        if (!formData.notes.trim()) return
        operation = 'update_notes'
        data = { notes: formData.notes.trim() }
        break
      case 'export':
        operation = 'export'
        data = { format: formData.exportFormat }
        break
    }

    onSave(operation, data)
    onClose()
  }

  const tabs = [
    { id: 'category', label: 'Add Category', icon: Folder },
    { id: 'tags', label: 'Add Tags', icon: Tag },
    { id: 'notes', label: 'Update Notes', icon: FileText },
    { id: 'export', label: 'Export', icon: Download }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Bulk Edit {selectedCount} Entries
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'category' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Enter category name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Category Assignment</h4>
                <p className="text-sm text-blue-700">
                  This will assign the selected category to all {selectedCount} selected entries. 
                  Existing categories will be updated.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Enter tags separated by commas..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Example: ancient, mythology, sacred, ritual
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">Tag Addition</h4>
                <p className="text-sm text-green-700">
                  These tags will be added to all {selectedCount} selected entries. 
                  Existing tags will be preserved.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter notes for all selected entries..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">Notes Update</h4>
                <p className="text-sm text-yellow-700">
                  This will replace the notes for all {selectedCount} selected entries. 
                  Existing notes will be overwritten.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <select
                  value={formData.exportFormat}
                  onChange={(e) => setFormData({ ...formData, exportFormat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel (XLSX)</option>
                  <option value="txt">Plain Text</option>
                </select>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-purple-900 mb-2">Export Options</h4>
                <p className="text-sm text-purple-700">
                  Export all {selectedCount} selected entries in the chosen format. 
                  The file will be downloaded automatically.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={activeTab === 'export' ? false : !formData[activeTab as keyof typeof formData]?.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>
              {activeTab === 'export' ? 'Export' : 'Apply Changes'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
