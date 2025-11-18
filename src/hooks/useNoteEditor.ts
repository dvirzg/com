import { useState, useCallback } from 'react'
import { noteService, NoteData } from '../services/noteService'
import { useToast } from '../contexts/ToastContext'

interface SaveResult {
  error?: string | Error
  data?: { id: string }
}

interface UseNoteEditorReturn {
  loading: boolean
  saveDraft: (
    noteData: NoteData,
    noteId: string | null,
    onSuccess?: (savedNote: { id: string }) => void | Promise<void>
  ) => Promise<SaveResult>
  publishNote: (
    noteData: NoteData & { published_at?: string },
    noteId: string | null,
    onSuccess?: (savedNote: { id: string }) => void | Promise<void>
  ) => Promise<SaveResult>
}

export const useNoteEditor = (): UseNoteEditorReturn => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const saveDraft = useCallback(async (
    noteData: NoteData,
    noteId: string | null = null,
    onSuccess?: (savedNote: { id: string }) => void | Promise<void>
  ): Promise<SaveResult> => {
    if (!noteData.title.trim()) {
      showToast('Please enter a title', 'error')
      return { error: 'Title required' }
    }
    if (!noteData.content.trim()) {
      showToast('Please write some content', 'error')
      return { error: 'Content required' }
    }

    setLoading(true)

    const payload: NoteData = {
      ...noteData,
      published: false
    }

    let result
    if (noteId) {
      result = await noteService.updateNote(noteId, payload)
    } else {
      result = await noteService.createNote(payload)
    }

    setLoading(false)

    if (result.error) {
      showToast('Error saving draft: ' + result.error.message, 'error')
      return result
    }

    if (onSuccess) {
      await onSuccess(result.data || { id: noteId! })
    }

    return result
  }, [showToast])

  const publishNote = useCallback(async (
    noteData: NoteData & { published_at?: string },
    noteId: string | null = null,
    onSuccess?: (savedNote: { id: string }) => void | Promise<void>
  ): Promise<SaveResult> => {
    if (!noteData.title.trim()) {
      showToast('Please enter a title', 'error')
      return { error: 'Title required' }
    }
    if (!noteData.content.trim()) {
      showToast('Please write some content', 'error')
      return { error: 'Content required' }
    }

    setLoading(true)

    const publishedAtTimestamp = noteData.published_at
      ? new Date(noteData.published_at).toISOString()
      : new Date().toISOString()

    const payload: NoteData = {
      ...noteData,
      published: true,
      published_at: publishedAtTimestamp
    }

    let result
    if (noteId) {
      result = await noteService.updateNote(noteId, payload)
    } else {
      result = await noteService.createNote(payload)
    }

    setLoading(false)

    if (result.error) {
      showToast('Error publishing note: ' + result.error.message, 'error')
      return result
    }

    if (onSuccess) {
      await onSuccess(result.data || { id: noteId! })
    }

    return result
  }, [showToast])

  return {
    loading,
    saveDraft,
    publishNote
  }
}
