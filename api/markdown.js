import { createClient } from '@supabase/supabase-js'
import { logger } from './lib/logger.js'
import { getMarkdownForPath } from './lib/markdown.js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  const path = req.query.path || '/'

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { markdown, status } = await getMarkdownForPath(supabase, path)

    return res.status(status)
      .setHeader('Content-Type', 'text/markdown; charset=utf-8')
      .send(markdown)
  } catch (err) {
    logger.error('Error fetching markdown:', err)
    return res.status(500).send('Error fetching markdown content')
  }
}
