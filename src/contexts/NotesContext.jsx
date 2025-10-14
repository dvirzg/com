import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const NotesContext = createContext({})

export const useNotes = () => useContext(NotesContext)

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState(null)
  const [drafts, setDrafts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [draftsLoading, setDraftsLoading] = useState(false)

  const fetchNotes = async () => {
    setLoading(true)
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
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (!error) {
      // Flatten categories structure
      const notesWithCategories = (data || []).map(note => ({
        ...note,
        categories: note.note_categories?.map(nc => nc.categories) || []
      }))
      setNotes(notesWithCategories)
    }
    setLoading(false)
  }

  const fetchDrafts = async () => {
    setDraftsLoading(true)
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
      .eq('published', false)
      .order('created_at', { ascending: false })

    if (!error) {
      // Flatten categories structure
      const draftsWithCategories = (data || []).map(note => ({
        ...note,
        categories: note.note_categories?.map(nc => nc.categories) || []
      }))
      setDrafts(draftsWithCategories)
    } else {
      console.error('Error fetching drafts:', error)
    }
    setDraftsLoading(false)
  }

  const getNote = async (id) => {
    // Check cache first
    if (notes) {
      const cached = notes.find(note => note.id === id)
      if (cached) return cached
    }

    // Fetch from database if not in cache
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

    if (error || !data?.published) {
      return null
    }
    return {
      ...data,
      categories: data.note_categories?.map(nc => nc.categories) || []
    }
  }

  const getNoteForEdit = async (id) => {
    // Fetch note for editing (regardless of published status)
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

    if (error) {
      return null
    }
    return {
      ...data,
      categories: data.note_categories?.map(nc => nc.categories) || []
    }
  }

  const deleteNote = async (id) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (!error) {
      // Remove from both local states
      setNotes(prevNotes => prevNotes?.filter(note => note.id !== id) || [])
      setDrafts(prevDrafts => prevDrafts?.filter(note => note.id !== id) || [])
    }

    return { error }
  }

  const refetch = () => {
    fetchNotes()
    fetchDrafts()
  }

  useEffect(() => {
    fetchNotes()
  }, [])

  return (
    <NotesContext.Provider value={{ notes, drafts, loading, draftsLoading, getNote, getNoteForEdit, deleteNote, refetch, fetchDrafts }}>
      {children}
    </NotesContext.Provider>
  )
}
