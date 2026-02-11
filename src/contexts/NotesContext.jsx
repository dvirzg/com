import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

const NotesContext = createContext({})

export const useNotes = () => useContext(NotesContext)

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState(null)
  const [drafts, setDrafts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [draftsLoading, setDraftsLoading] = useState(false)

  const fetchNotes = useCallback(async () => {
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
  }, [])

  const fetchDrafts = useCallback(async () => {
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
      logger.error('Error fetching drafts:', error)
    }
    setDraftsLoading(false)
  }, [])

  const getNote = useCallback(async (id) => {
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
  }, [notes])

  const getNoteForEdit = useCallback(async (id) => {
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
  }, [])

  const deleteNote = useCallback(async (id) => {
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
  }, [])

  const refetch = useCallback(() => {
    fetchNotes()
    fetchDrafts()
  }, [fetchNotes, fetchDrafts])

  // Lazy load notes - only fetch when explicitly called via refetch()
  // This prevents loading all notes on app init for better performance
  useEffect(() => {
    // Don't auto-fetch on mount - let pages call refetch() when needed
    setLoading(false)
  }, [])

  const value = useMemo(() => ({
    notes,
    drafts,
    loading,
    draftsLoading,
    getNote,
    getNoteForEdit,
    deleteNote,
    refetch,
    fetchDrafts
  }), [notes, drafts, loading, draftsLoading, getNote, getNoteForEdit, deleteNote, refetch, fetchDrafts])

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  )
}
