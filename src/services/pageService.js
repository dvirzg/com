import { supabase } from '../lib/supabase'

export const pageService = {
  async getNavPages() {
    const { data, error } = await supabase
      .from('pages')
      .select('slug, title, nav_order')
      .eq('show_in_nav', true)
      .order('nav_order', { ascending: true })

    if (error) return []
    return data
  },

  async getPageBySlug(slug) {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) return null
    return data
  },

  async createPage(pageData) {
    const { data, error } = await supabase
      .from('pages')
      .insert([pageData])
      .select()

    return { data: data?.[0], error }
  },

  async updatePage(id, pageData) {
    const { error } = await supabase
      .from('pages')
      .update(pageData)
      .eq('id', id)

    return { error }
  },

  async deletePage(id) {
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', id)

    return { error }
  }
}
