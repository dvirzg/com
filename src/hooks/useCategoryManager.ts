import { useState, useEffect, useCallback } from 'react'
import { categoryService, Category } from '../services/categoryService'
import { useToast } from '../contexts/ToastContext'

interface UseCategoryManagerReturn {
  allCategories: Category[]
  selectedCategories: Category[]
  newCategoryInput: string
  setNewCategoryInput: (value: string) => void
  showCategoryInput: boolean
  setShowCategoryInput: (value: boolean) => void
  handleAddCategory: () => Promise<void>
  handleRemoveCategory: (categoryId: string) => void
  handleToggleCategory: (category: Category) => void
  saveCategories: (noteId: string) => Promise<{ error: Error | null }>
}

export const useCategoryManager = (noteId: string | null): UseCategoryManagerReturn => {
  const { showToast } = useToast()
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
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

  const loadNoteCategories = async (id: string) => {
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
    } else if (data) {
      setAllCategories([...allCategories, data])
      setSelectedCategories([...selectedCategories, data])
      setNewCategoryInput('')
      setShowCategoryInput(false)
    }
  }, [newCategoryInput, allCategories, selectedCategories, showToast])

  const handleRemoveCategory = useCallback((categoryId: string) => {
    setSelectedCategories(selectedCategories.filter(c => c.id !== categoryId))
  }, [selectedCategories])

  const handleToggleCategory = useCallback((category: Category) => {
    const isSelected = selectedCategories.find(c => c.id === category.id)
    if (isSelected) {
      setSelectedCategories(selectedCategories.filter(c => c.id !== category.id))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }, [selectedCategories])

  const saveCategories = useCallback(async (noteId: string) => {
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
