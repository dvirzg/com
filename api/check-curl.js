import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

// Detect if request is from curl, wget, or automated tools
function isAutomatedRequest(userAgent) {
  if (!userAgent) return false

  const automatedPatterns = [
    /curl/i,
    /wget/i,
    /python-requests/i,
    /httpie/i,
    /postman/i,
    /insomnia/i,
    /axios/i,
    /node-fetch/i,
    /go-http-client/i,
    /java/i,
    /apache-httpclient/i,
    /okhttp/i,
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ]

  return automatedPatterns.some(pattern => pattern.test(userAgent))
}

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
      console.error('Error fetching curl behavior:', error)
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
      // Redirect to markdown API endpoint
      return res.redirect(307, `/api/markdown?path=${encodeURIComponent(requestPath)}`)
    } else {
      // curlBehavior === 'html' - serve the SPA
      const indexPath = join(process.cwd(), 'dist', 'index.html')
      const html = readFileSync(indexPath, 'utf-8')
      return res.status(200).setHeader('Content-Type', 'text/html').send(html)
    }

  } catch (err) {
    console.error('Error in check-curl:', err)
    // Default to serving HTML on error
    const indexPath = join(process.cwd(), 'dist', 'index.html')
    const html = readFileSync(indexPath, 'utf-8')
    return res.status(200).setHeader('Content-Type', 'text/html').send(html)
  }
}
