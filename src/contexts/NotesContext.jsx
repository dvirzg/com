import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const NotesContext = createContext({})

export const useNotes = () => useContext(NotesContext)

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchNotes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (!error) {
      setNotes(data || [])
    }
    setLoading(false)
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
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data?.published) {
      return null
    }
    return data
  }

  const getNoteForEdit = async (id) => {
    // Fetch note for editing (regardless of published status)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return null
    }
    return data
  }

  const deleteNote = async (id) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (!error) {
      // Remove from local state
      setNotes(prevNotes => prevNotes?.filter(note => note.id !== id) || [])
    }
    
    return { error }
  }

  const refetch = () => {
    fetchNotes()
  }

  useEffect(() => {
    fetchNotes()
  }, [])

  return (
    <NotesContext.Provider value={{ notes, loading, getNote, getNoteForEdit, deleteNote, refetch }}>
      {children}
    </NotesContext.Provider>
  )
}
