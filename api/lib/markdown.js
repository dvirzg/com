/**
 * Fetch a note by ID and return as markdown
 * @param {object} supabase - Supabase client
 * @param {string} noteId - The note ID to fetch
 * @returns {Promise<{markdown: string|null, error: string|null, status: number}>}
 */
export async function getNoteMarkdown(supabase, noteId) {
  const { data: note, error } = await supabase
    .from('notes')
    .select('title, content')
    .eq('id', noteId)
    .eq('published', true)
    .single()

  if (error || !note) {
    return { markdown: null, error: 'Note not found', status: 404 }
  }

  const markdown = `# ${note.title}\n\n${note.content}`
  return { markdown, error: null, status: 200 }
}

/**
 * Fetch a page by slug and return as markdown
 * @param {object} supabase - Supabase client
 * @param {string} slug - The page slug to fetch
 * @returns {Promise<{markdown: string|null, error: string|null, status: number}>}
 */
export async function getPageMarkdown(supabase, slug) {
  const { data: page, error } = await supabase
    .from('pages')
    .select('title, content')
    .eq('slug', slug)
    .single()

  if (error || !page) {
    return { markdown: null, error: null, status: null }
  }

  const markdown = `# ${page.title}\n\n${page.content}`
  return { markdown, error: null, status: 200 }
}

/**
 * Get markdown content based on path
 * @param {object} supabase - Supabase client
 * @param {string} path - The request path
 * @returns {Promise<{markdown: string, status: number}>}
 */
export async function getMarkdownForPath(supabase, path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  // Handle note paths
  if (cleanPath.startsWith('/notes/')) {
    const noteId = cleanPath.replace('/notes/', '').split('?')[0]
    const result = await getNoteMarkdown(supabase, noteId)

    if (result.error) {
      return { markdown: 'Note not found', status: 404 }
    }
    return { markdown: result.markdown, status: 200 }
  }

  // Handle custom pages (skip home and admin routes)
  if (cleanPath !== '/' && cleanPath !== '/notes' && cleanPath !== '/admin') {
    const slug = cleanPath.replace(/^\//, '').split('?')[0]
    const result = await getPageMarkdown(supabase, slug)

    if (result.markdown) {
      return { markdown: result.markdown, status: 200 }
    }
  }

  // Default home page
  const defaultMarkdown = `# Welcome\n\nThis is a personal website. Visit in a web browser for the full experience.\n\nPath: ${cleanPath}`
  return { markdown: defaultMarkdown, status: 200 }
}
