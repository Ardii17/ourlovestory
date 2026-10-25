import JSZip from 'jszip'

export interface DownloadItem {
  url: string
  filename: string
}

/**
 * Downloads a single file by fetching it as a blob to force browser download.
 */
export async function downloadSingleFile(url: string, defaultFilename?: string): Promise<void> {
  const cleanFilename = defaultFilename || url.split('/').pop()?.split('?')[0] || `media-${Date.now()}`
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = cleanFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.warn('Blob download failed or blocked by CORS, trying fallback direct download:', error)
    // Fallback: create an anchor element
    const link = document.createElement('a')
    link.href = url
    link.download = cleanFilename
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Downloads multiple files bundled into a single ZIP archive.
 */
export async function downloadMultipleAsZip(
  items: DownloadItem[],
  zipFilename: string = 'media-gallery.zip',
  onProgress?: (progress: { current: number; total: number; percent: number }) => void
): Promise<void> {
  if (items.length === 0) return

  // If only 1 item, we can directly download it
  if (items.length === 1) {
    if (onProgress) onProgress({ current: 1, total: 1, percent: 100 })
    await downloadSingleFile(items[0].url, items[0].filename)
    return
  }

  const zip = new JSZip()
  const total = items.length
  const usedFilenames: Record<string, number> = {}

  for (let i = 0; i < total; i++) {
    const item = items[i]
    try {
      const response = await fetch(item.url)
      if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`)
      const blob = await response.blob()

      // Determine extension
      let filename = item.filename.trim()
      let ext = filename.includes('.') ? filename.split('.').pop() || '' : ''
      let baseName = ext ? filename.slice(0, -(ext.length + 1)) : filename

      if (!ext) {
        if (blob.type.includes('jpeg') || blob.type.includes('jpg')) ext = 'jpg'
        else if (blob.type.includes('png')) ext = 'png'
        else if (blob.type.includes('webp')) ext = 'webp'
        else if (blob.type.includes('mp4')) ext = 'mp4'
        else ext = 'jpg'
      }

      let finalName = `${baseName}.${ext}`
      if (usedFilenames[finalName]) {
        usedFilenames[finalName] += 1
        finalName = `${baseName}-${usedFilenames[finalName]}.${ext}`
      } else {
        usedFilenames[finalName] = 1
      }

      zip.file(finalName, blob)
    } catch (err) {
      console.error(`Error processing file ${item.url}:`, err)
    }

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        percent: Math.round(((i + 1) / total) * 100),
      })
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const blobUrl = window.URL.createObjectURL(zipBlob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}
