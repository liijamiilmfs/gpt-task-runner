/**
 * Clipboard and filename utilities for Librán Voice Forge
 */

/**
 * Generate a simple hash using Web Crypto API (browser-compatible)
 */
async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8)
}

/**
 * Generate a filename template for audio files
 * Format: {variant}-{hash}-{timestamp}.{extension}
 */
export async function generateFilename(
  variant: 'ancient' | 'modern',
  content: string,
  extension: string = 'mp3'
): Promise<string> {
  // Generate a short hash of the content for uniqueness
  const hash = await generateHash(content)
  
  // Generate timestamp in YYYYMMDD-HHMMSS format
  const now = new Date()
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-')
  
  return `${variant}-${hash}-${timestamp}.${extension}`
}

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    return successful
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Download content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  try {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the URL object
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download file:', error)
  }
}

/**
 * Download audio blob as a file
 */
export function downloadAudioFile(blob: Blob, filename: string): void {
  try {
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the URL object
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download audio file:', error)
  }
}

/**
 * Format content for display with proper line breaks
 */
export function formatContentForDisplay(content: string): string {
  return content.replace(/\n/g, '<br>')
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate filename for cross-platform compatibility
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 255) // Limit length
}
