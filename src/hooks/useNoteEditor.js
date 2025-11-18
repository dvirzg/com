import { useState, useCallback } from 'react'
import { noteService } from '../services/noteService'
import { useToast } from '../contexts/ToastContext'

export const useNoteEditor = () => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const saveDraft = useCallback(async (noteData, noteId = null, onSuccess) => {
    if (!noteData.title.trim()) {
      showToast('Please enter a title', 'error')
      return { error: 'Title required' }
    }
    if (!noteData.content.trim()) {
      showToast('Please write some content', 'error')
      return { error: 'Content required' }
    }

    setLoading(true)

    const payload = {
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
      onSuccess(result.data || { id: noteId })
    }

    return result
  }, [showToast])

  const publishNote = useCallback(async (noteData, noteId = null, onSuccess) => {
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

    const payload = {
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
      onSuccess(result.data || { id: noteId })
    }

    return result
  }, [showToast])

  return {
    loading,
    saveDraft,
    publishNote
  }
}
