import { createClient } from '@supabase/supabase-js'
import { logger } from './lib/logger.js'

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

export default async function handler(req, res) {
  const { slug } = req.query

  if (!slug) {
    return res.status(400).send('Missing slug parameter')
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Look up the sublink to get the file path
    const { data: sublinkData, error: sublinkError } = await supabase
      .from('sublinks')
      .select('file_path, type')
      .eq('slug', slug)
      .single()

    if (sublinkError || !sublinkData) {
      logger.error('Sublink not found:', sublinkError)
      return res.status(404).send('Sublink not found')
    }

    // Only handle file type sublinks
    if (sublinkData.type !== 'file' || !sublinkData.file_path) {
      return res.status(400).send('Not a file sublink')
    }

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('sublinks')
      .download(sublinkData.file_path)

    if (downloadError) {
      logger.error('Error downloading file from Supabase:', downloadError)
      return res.status(404).send('File not found')
    }

    // Get file extension and determine MIME type
    const fileExt = sublinkData.file_path.split('.').pop().toLowerCase()
    const contentType = MIME_TYPES[fileExt] || 'application/octet-stream'

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer())

    // Set headers to enable native browser viewing
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', buffer.length)
    res.setHeader('Content-Disposition', 'inline') // Always inline for native viewing
    res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    res.setHeader('Accept-Ranges', 'bytes') // Enable range requests for video seeking

    return res.status(200).send(buffer)

  } catch (err) {
    logger.error('Error in file-proxy:', err)
    return res.status(500).send('Error fetching file')
  }
}
