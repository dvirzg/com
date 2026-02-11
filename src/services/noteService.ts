import { supabase } from '../lib/supabase'

export interface Note {
  id: string
  title: string
  content: string
  alignment?: string
  published: boolean
  published_at?: string
  created_at: string
  updated_at: string
  categories?: Category[]
}

export interface Category {
  id: string
  name: string
}

export interface NoteData {
  title: string
  content: string
  alignment?: string
  published?: boolean
  published_at?: string
}

export const noteService = {
  async getNote(id: string): Promise<Note | null> {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        note_categories (
          categories (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .eq('published', true)
      .single()

    if (error) return null

    // Flatten categories structure
    const note = {
      ...data,
      categories: data.note_categories?.map((nc: any) => nc.categories) || []
    }
    return note as Note
  },

  async getNoteForEdit(id: string): Promise<Note | null> {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        note_categories (
          categories (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) return null

    // Flatten categories structure
    const note = {
      ...data,
      categories: data.note_categories?.map((nc: any) => nc.categories) || []
    }
    return note as Note
  },

  async createNote(noteData: NoteData): Promise<{ data: Note | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('notes')
      .insert([noteData])
      .select()

    return { data: data?.[0] as Note || null, error }
  },

  async updateNote(id: string, noteData: Partial<NoteData>): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('notes')
      .update(noteData)
      .eq('id', id)

    return { error }
  },

  async deleteNote(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    return { error }
  },

  async getAllNotes(published: boolean | null = true): Promise<Note[]> {
    let query = supabase
      .from('notes')
      .select(`
        *,
        note_categories (
          categories (
            id,
            name
          )
        )
      `)
      .order('published_at', { ascending: false })

    if (published !== null) {
      query = query.eq('published', published)
    }

    const { data, error } = await query

    if (error) return []

    // Flatten categories structure
    const notes = (data || []).map((note: any) => ({
      ...note,
      categories: note.note_categories?.map((nc: any) => nc.categories) || []
    }))

    return notes as Note[]
  }
}
