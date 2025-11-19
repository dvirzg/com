import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { logger } from './lib/logger.js'
import { isAutomatedRequest } from './lib/utils.js'
import { getMarkdownForPath } from './lib/markdown.js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  const userAgent = req.headers['user-agent'] || ''
  const requestPath = req.query.path || '/'

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

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
