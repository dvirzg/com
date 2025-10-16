import { supabase } from './supabase'

/**
 * Upload a file to Supabase Storage and return the public URL
 * @param {File} file - The file to upload
 * @param {string} userId - The user ID for organizing files
 * @returns {Promise<{url: string, error: null} | {url: null, error: string}>}
 */
export const uploadMedia = async (file, userId) => {
  try {
    // Validate file
    if (!file) {
      return { url: null, error: 'No file provided' }
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { url: null, error: 'File size exceeds 10MB limit' }
    }

    // Check file type (images and videos only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      return { url: null, error: 'Only images and videos are allowed' }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${timestamp}-${randomString}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { url: null, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(data.path)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Upload error:', error)
    return { url: null, error: error.message || 'Upload failed' }
  }
}

/**
 * Generate markdown for uploaded media
 * @param {string} url - The public URL of the media
 * @param {string} fileName - Original file name
 * @param {string} fileType - MIME type of the file
 * @returns {string} Markdown formatted string
 */
export const generateMarkdown = (url, fileName, fileType) => {
  if (fileType.startsWith('image/')) {
    const altText = fileName.split('.')[0].replace(/[-_]/g, ' ')
    return `![${altText}](${url})`
  } else if (fileType.startsWith('video/')) {
    // For videos, we'll use HTML5 video tag wrapped in markdown
    return `<video src="${url}" controls style="max-width: 100%; height: auto;"></video>`
  }
  return `[${fileName}](${url})`
}
