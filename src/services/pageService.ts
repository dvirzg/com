import { supabase } from '../lib/supabase'

export interface Page {
  id: string
  slug: string
  title: string
  content: string
  show_in_nav: boolean
  nav_order: number
  created_at: string
  updated_at: string
}

export interface NavPage {
  slug: string
  title: string
  nav_order: number
}

export interface PageData {
  slug: string
  title: string
  content: string
  show_in_nav?: boolean
  nav_order?: number
}

export const pageService = {
  async getNavPages(): Promise<NavPage[]> {
    const { data, error } = await supabase
      .from('pages')
      .select('slug, title, nav_order')
      .eq('show_in_nav', true)
      .order('nav_order', { ascending: true })

    if (error) return []
    return data as NavPage[]
  },

  async getPageBySlug(slug: string): Promise<Page | null> {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) return null
    return data as Page
  },

  async createPage(pageData: PageData): Promise<{ data: Page | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('pages')
      .insert([pageData])
      .select()

    return { data: data?.[0] as Page || null, error }
  },

  async updatePage(id: string, pageData: Partial<PageData>): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('pages')
      .update(pageData)
      .eq('id', id)

    return { error }
  },

  async deletePage(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', id)

    return { error }
  }
}
