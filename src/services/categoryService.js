import { supabase } from '../lib/supabase'

export const categoryService = {
  async getAllCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) return []
    return data
  },

  async createCategory(name) {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name }])
      .select()
      .single()

    return { data, error }
  },

  async getNoteCategories(noteId) {
    const { data, error } = await supabase
      .from('note_categories')
      .select('category_id, categories(id, name)')
      .eq('note_id', noteId)

    if (error) return []
    return data.map(nc => nc.categories)
  },

  async saveNoteCategories(noteId, categoryIds) {
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
