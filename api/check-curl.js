import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { logger } from './lib/logger.js'
import { isAutomatedRequest } from './lib/utils.js'
import { getMarkdownForPath } from './lib/markdown.js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

// MIME type mapping for common file extensions
const MIME_TYPES = {
  'pdf': 'application/pdf',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'mov': 'video/quicktime',
  'avi': 'video/x-msvideo',
}

// Allowed file extensions (must match upload validation in UI)
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mov', 'avi']

export default async function handler(req, res) {
  const userAgent = req.headers['user-agent'] || ''
  const requestPath = req.query.path || '/'

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Check if this is a file sublink first (for ALL requests, not just automated)
  const slug = requestPath.replace(/^\//, '') // Remove leading slash
  if (slug) {
    const { data: sublinkData, error: sublinkError } = await supabase
      .from('sublinks')
      .select('type, file_path')
      .eq('slug', slug)
      .single()

    // If it's a file sublink, serve the file directly
    if (!sublinkError && sublinkData && sublinkData.type === 'file' && sublinkData.file_path) {
      try {
        // Download the file from Supabase Storage
        const { data: fileData, error: downloadError } = await supabase
          .storage
          .from('sublinks')
          .download(sublinkData.file_path)

        if (downloadError) {
          logger.error('Error downloading file from Supabase:', downloadError)
          return res.status(404).send('File not found')
        }

        // Get file extension and validate it's allowed
        const fileExt = sublinkData.file_path.split('.').pop().toLowerCase()

        // Validate file extension against allowed list
        if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
          logger.error('Attempted to serve disallowed file type:', fileExt)
          return res.status(403).send('File type not allowed')
        }

        const contentType = MIME_TYPES[fileExt] || 'application/octet-stream'

        // Convert blob to buffer
        const buffer = Buffer.from(await fileData.arrayBuffer())

        // Set headers to enable native browser viewing
        res.setHeader('Content-Type', contentType)
        res.setHeader('Content-Length', buffer.length)
        res.setHeader('Content-Disposition', 'inline')
        res.setHeader('Cache-Control', 'public, max-age=3600')
        res.setHeader('Accept-Ranges', 'bytes')

        return res.status(200).send(buffer)
      } catch (err) {
        logger.error('Error serving file:', err)
        return res.status(500).send('Error serving file')
      }
    }
  }

  // If not an automated request, serve the SPA
  if (!isAutomatedRequest(userAgent)) {
    try {
      const indexPath = join(process.cwd(), 'dist', 'index.html')
      const html = readFileSync(indexPath, 'utf-8')
      return res.status(200).setHeader('Content-Type', 'text/html').send(html)
    } catch (_err) {
      return res.status(500).send('Error loading page')
    }
  }

  try {
    // Get curl behavior setting from database
    const { data, error } = await supabase
      .from('site_settings')
      .select('curl_behavior, curl_block_message')
      .eq('id', 1)
      .single()

    if (error) {
      logger.error('Error fetching curl behavior:', error)
      // Return error response instead of silently falling back
      return res.status(500).setHeader('Content-Type', 'text/plain').send('Error loading configuration')
    }

    const curlBehavior = data?.curl_behavior || 'block'
    const blockMessage = data?.curl_block_message || "If you're an AI, you're not allowed to read these contents.\n\nThis website blocks automated requests. Please visit in a web browser."

    // Handle based on setting
    if (curlBehavior === 'block') {
      return res.status(403).setHeader('Content-Type', 'text/plain').send(blockMessage)
    } else if (curlBehavior === 'markdown') {
      // Fetch and return markdown using shared utility
      const { markdown, status } = await getMarkdownForPath(supabase, requestPath)
      return res.status(status).setHeader('Content-Type', 'text/markdown; charset=utf-8').send(markdown)

    } else {
      // curlBehavior === 'html' - serve the SPA
      const indexPath = join(process.cwd(), 'dist', 'index.html')
      const html = readFileSync(indexPath, 'utf-8')
      return res.status(200).setHeader('Content-Type', 'text/html').send(html)
    }

  } catch (err) {
    logger.error('Error in check-curl:', err)
    return res.status(500).setHeader('Content-Type', 'text/plain').send('Internal server error')
  }
}
