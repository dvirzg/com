import { supabase } from '../lib/supabase'

export const noteService = {
  async getNote(id) {
    const { data, error } = await supabase
      .from('notes')
      .select('*, categories(id, name)')
      .eq('id', id)
      .eq('published', true)
      .single()

    if (error) return null
    return data
  },

  async getNoteForEdit(id) {
    const { data, error } = await supabase
      .from('notes')
      .select('*, categories(id, name)')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  async createNote(noteData) {
    const { data, error } = await supabase
      .from('notes')
      .insert([noteData])
      .select()

    return { data: data?.[0], error }
  },

  async updateNote(id, noteData) {
    const { error } = await supabase
      .from('notes')
      .update(noteData)
      .eq('id', id)

    return { error }
  },

  async deleteNote(id) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    return { error }
  },

  async getAllNotes(published = true) {
    const query = supabase
      .from('notes')
      .select('*')
      .order('published_at', { ascending: false })

    if (published !== null) {
      query.eq('published', published)
    }

    const { data, error } = await query

    if (error) return []
    return data
  }
}
