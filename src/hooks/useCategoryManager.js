import { useState, useEffect, useCallback } from 'react'
import { categoryService } from '../services/categoryService'
import { useToast } from '../contexts/ToastContext'

export const useCategoryManager = (noteId) => {
  const { showToast } = useToast()
  const [allCategories, setAllCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [showCategoryInput, setShowCategoryInput] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (noteId) {
      loadNoteCategories(noteId)
    }
  }, [noteId])

  const loadCategories = async () => {
    const data = await categoryService.getAllCategories()
    setAllCategories(data)
  }

  const loadNoteCategories = async (id) => {
    const data = await categoryService.getNoteCategories(id)
    setSelectedCategories(data)
  }

  const handleAddCategory = useCallback(async () => {
    const categoryName = newCategoryInput.trim()
    if (!categoryName) return

    const existing = allCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
    if (existing) {
      if (!selectedCategories.find(c => c.id === existing.id)) {
        setSelectedCategories([...selectedCategories, existing])
      }
      setNewCategoryInput('')
      setShowCategoryInput(false)
      return
    }

    const { data, error } = await categoryService.createCategory(categoryName)

    if (error) {
      showToast('Error creating category: ' + error.message, 'error')
    } else {
      setAllCategories([...allCategories, data])
      setSelectedCategories([...selectedCategories, data])
      setNewCategoryInput('')
      setShowCategoryInput(false)
    }
  }, [newCategoryInput, allCategories, selectedCategories, showToast])

  const handleRemoveCategory = useCallback((categoryId) => {
    setSelectedCategories(selectedCategories.filter(c => c.id !== categoryId))
  }, [selectedCategories])

  const handleToggleCategory = useCallback((category) => {
    const isSelected = selectedCategories.find(c => c.id === category.id)
    if (isSelected) {
      setSelectedCategories(selectedCategories.filter(c => c.id !== category.id))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }, [selectedCategories])

  const saveCategories = useCallback(async (noteId) => {
    const categoryIds = selectedCategories.map(cat => cat.id)
    return await categoryService.saveNoteCategories(noteId, categoryIds)
  }, [selectedCategories])

  return {
    allCategories,
    selectedCategories,
    newCategoryInput,
    setNewCategoryInput,
    showCategoryInput,
    setShowCategoryInput,
    handleAddCategory,
    handleRemoveCategory,
    handleToggleCategory,
    saveCategories
  }
}
