import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  const path = req.query.path || '/'

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Handle different path types
    if (path.startsWith('/notes/')) {
      // Extract note ID from path
      const noteId = path.replace('/notes/', '')

      // Fetch note from database (only published notes)
      const { data: note, error } = await supabase
        .from('notes')
        .select('title, content')
        .eq('id', noteId)
        .eq('published', true)
        .single()

      if (error || !note) {
        return res.status(404).send('Note not found')
      }

      // Notes already store content as markdown, just return it
      const markdown = `# ${note.title}\n\n${note.content}`

      return res.status(200)
        .setHeader('Content-Type', 'text/markdown; charset=utf-8')
        .send(markdown)

    } else if (path !== '/' && path !== '/notes' && path !== '/admin') {
      // Check if it's a custom page
      const slug = path.replace(/^\//, '')

      const { data: page, error } = await supabase
        .from('pages')
        .select('title, content')
        .eq('slug', slug)
        .single()

      if (!error && page) {
        // Pages store content as plain text/markdown, return directly
        const markdown = `# ${page.title}\n\n${page.content}`

        return res.status(200)
          .setHeader('Content-Type', 'text/markdown; charset=utf-8')
          .send(markdown)
      }
    }

    // For home page or other pages without specific content
    const response = `# Welcome\n\nThis is a personal website. Visit in a web browser for the full experience.\n\nPath: ${path}`

    return res.status(200)
      .setHeader('Content-Type', 'text/markdown; charset=utf-8')
      .send(response)

  } catch (err) {
    console.error('Error fetching markdown:', err)
    return res.status(500).send('Error fetching markdown content')
  }
}
