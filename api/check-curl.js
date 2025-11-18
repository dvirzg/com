import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { logger } from './lib/logger.js'
import { isAutomatedRequest } from './lib/utils.js'

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
    } catch (err) {
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
      // Default to serving HTML on error
      const indexPath = join(process.cwd(), 'dist', 'index.html')
      const html = readFileSync(indexPath, 'utf-8')
      return res.status(200).setHeader('Content-Type', 'text/html').send(html)
    }

    const curlBehavior = data?.curl_behavior || 'block'
    const blockMessage = data?.curl_block_message || "If you're an AI, you're not allowed to read these contents.\n\nThis website blocks automated requests. Please visit in a web browser."

    // Handle based on setting
    if (curlBehavior === 'block') {
      return res.status(403).setHeader('Content-Type', 'text/plain').send(blockMessage)
    } else if (curlBehavior === 'markdown') {
      // Fetch and return markdown directly
      const path = requestPath.startsWith('/') ? requestPath : `/${requestPath}`

      if (path.startsWith('/notes/')) {
        // Extract note ID from path
        const noteId = path.replace('/notes/', '').split('?')[0]

        // Fetch note from database (only published notes)
        const { data: note, error: noteError } = await supabase
          .from('notes')
          .select('title, content')
          .eq('id', noteId)
          .eq('published', true)
          .single()

        if (noteError || !note) {
          return res.status(404).setHeader('Content-Type', 'text/plain').send('Note not found')
        }

        // Return markdown
        const markdown = `# ${note.title}\n\n${note.content}`
        return res.status(200).setHeader('Content-Type', 'text/markdown; charset=utf-8').send(markdown)

      } else if (path !== '/' && path !== '/notes' && path !== '/admin') {
        // Check if it's a custom page
        const slug = path.replace(/^\//, '').split('?')[0]

        const { data: page, error: pageError } = await supabase
          .from('pages')
          .select('title, content')
          .eq('slug', slug)
          .single()

        if (!pageError && page) {
          const markdown = `# ${page.title}\n\n${page.content}`
          return res.status(200).setHeader('Content-Type', 'text/markdown; charset=utf-8').send(markdown)
        }
      }

      // For home page or other pages without specific content
      const response = `# Welcome\n\nThis is a personal website. Visit in a web browser for the full experience.\n\nPath: ${path}`
      return res.status(200).setHeader('Content-Type', 'text/markdown; charset=utf-8').send(response)

    } else {
      // curlBehavior === 'html' - serve the SPA
      const indexPath = join(process.cwd(), 'dist', 'index.html')
      const html = readFileSync(indexPath, 'utf-8')
      return res.status(200).setHeader('Content-Type', 'text/html').send(html)
    }

  } catch (err) {
    logger.error('Error in check-curl:', err)
    // Default to serving HTML on error
    const indexPath = join(process.cwd(), 'dist', 'index.html')
    const html = readFileSync(indexPath, 'utf-8')
    return res.status(200).setHeader('Content-Type', 'text/html').send(html)
  }
}
