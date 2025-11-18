import { supabase } from '../lib/supabase'

export interface Category {
  id: string
  name: string
  created_at?: string
}

export const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) return []
    return data as Category[]
  },

  async createCategory(name: string): Promise<{ data: Category | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name }])
      .select()
      .single()

    return { data: data as Category || null, error }
  },

  async getNoteCategories(noteId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('note_categories')
      .select('category_id, categories(id, name)')
      .eq('note_id', noteId)

    if (error) return []
    return data.map((nc: any) => nc.categories) as Category[]
  },

  async saveNoteCategories(noteId: string, categoryIds: string[]): Promise<{ error: Error | null }> {
    // Delete existing associations
    await supabase
      .from('note_categories')
      .delete()
      .eq('note_id', noteId)

    // Insert new associations
    if (categoryIds.length > 0) {
      const insertData = categoryIds.map(catId => ({
        note_id: noteId,
        category_id: catId
      }))

      const { error } = await supabase
        .from('note_categories')
        .insert(insertData)

      return { error }
    }

    return { error: null }
  }
}
