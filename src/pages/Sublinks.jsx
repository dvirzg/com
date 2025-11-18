import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ExternalLink, Trash2, Edit2, Check, X, FileText, Upload } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { BACKGROUND_COLORS } from '../constants/colors'
import ScrollToTop from '../components/ScrollToTop'

const Sublinks = () => {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [sublinks, setSublinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ slug: '', url: '', type: 'url' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [showStickyTitle, setShowStickyTitle] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/')
      return
    }
    fetchSublinks()
  }, [user, isAdmin, navigate])

  useEffect(() => {
    const handleScroll = () => {
      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect()
        setShowStickyTitle(titleRect.top < 80)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchSublinks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('sublinks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching sublinks:', error)
    } else {
      setSublinks(data || [])
    }
    setLoading(false)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!formData.slug) return

    setUploadProgress(true)
    let finalUrl = formData.url
    let filePath = null

    const normalizedSlug = formData.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    // Check if a sublink with this slug already exists
    const { data: existingSublink } = await supabase
      .from('sublinks')
      .select('*')
      .eq('slug', normalizedSlug)
      .single()

    // Handle file upload
    if (formData.type === 'file' && selectedFile) {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${normalizedSlug}.${fileExt}`
      filePath = `files/${fileName}`

      // If there's an existing sublink with a file, delete the old file first
      if (existingSublink?.file_path) {
        const { error: removeError } = await supabase.storage
          .from('sublinks')
          .remove([existingSublink.file_path])

        if (removeError) {
          console.error('Error removing existing file:', removeError)
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('sublinks')
        .upload(filePath, selectedFile, { upsert: true })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        alert('Error uploading file: ' + uploadError.message)
        setUploadProgress(false)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sublinks')
        .getPublicUrl(filePath)

      finalUrl = publicUrl
    } else if (formData.type === 'url' && !formData.url) {
      alert('Please provide a URL')
      setUploadProgress(false)
      return
    }

    // Insert or update based on whether the slug already exists
    let error
    if (existingSublink) {
      // Update the existing sublink
      const result = await supabase
        .from('sublinks')
        .update({
          url: finalUrl,
          type: formData.type,
          file_path: filePath,
        })
        .eq('id', existingSublink.id)
      error = result.error
    } else {
      // Insert new sublink
      const result = await supabase.from('sublinks').insert([
        {
          slug: normalizedSlug,
          url: finalUrl,
          type: formData.type,
          file_path: filePath,
        },
      ])
      error = result.error
    }

    if (error) {
      console.error('Error creating/updating sublink:', error)
      alert('Error creating sublink: ' + error.message)
      setUploadProgress(false)
      return
    }

    setFormData({ slug: '', url: '', type: 'url' })
    setSelectedFile(null)
    setShowAddForm(false)
    fetchSublinks()
    setUploadProgress(false)
  }

  const handleUpdate = async (id, slug, url) => {
    const { error } = await supabase
      .from('sublinks')
      .update({ slug: slug.toLowerCase().replace(/\s+/g, '-'), url })
      .eq('id', id)

    if (error) {
      alert('Error updating sublink: ' + error.message)
    } else {
      setEditingId(null)
      fetchSublinks()
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this sublink?')) return

    // Find the sublink to check if it has a file to delete
    const sublink = sublinks.find(s => s.id === id)

    let storageDeleted = true
    let dbDeleted = false

    // Delete file from storage if it exists
    if (sublink?.file_path) {
      const { error: storageError } = await supabase.storage.from('sublinks').remove([sublink.file_path])
      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
        storageDeleted = false
        alert('Warning: Could not delete file from storage: ' + storageError.message + '\nWill still attempt to delete the database entry.')
      }
    }

    // Delete from database
    const { error: dbError } = await supabase.from('sublinks').delete().eq('id', id)

    if (dbError) {
      console.error('Error deleting sublink from database:', dbError)
      alert('Error deleting sublink from database: ' + dbError.message + '\n\nThis might be due to permission issues. Please check:\n1. You are logged in as an admin\n2. RLS policies are properly configured\n3. Try deleting from Supabase dashboard')
      return
    }

    dbDeleted = true

    // Provide feedback on what was deleted
    if (dbDeleted && storageDeleted) {
      console.log('Successfully deleted sublink and file')
    } else if (dbDeleted && !storageDeleted) {
      console.log('Deleted sublink from database but file deletion failed')
      alert('Sublink deleted, but the associated file may still exist in storage. You may need to manually delete it.')
    }

    fetchSublinks()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Accept video, image, and PDF files
      const validTypes = [
        'video/',
        'image/',
        'application/pdf'
      ]
      const isValid = validTypes.some(type => file.type.startsWith(type) || file.type === type)

      if (isValid) {
        setSelectedFile(file)
      } else {
        alert('Please select a video, image, or PDF file')
        e.target.value = ''
      }
    }
  }

  if (!user || !isAdmin()) {
    return null
  }

  return (
    <>
      {/* Sticky Title Header */}
      <div className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl transition-all duration-300 ${
        showStickyTitle ? 'translate-y-0 border-b border-zinc-200/50 dark:border-zinc-800/30' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">
              Sublinks
            </h1>
          </div>
        </div>
      </div>

      <div className="min-h-screen pt-24 px-6 pb-12 transition-colors">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 ref={titleRef} className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">
              Sublinks
            </h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-80 rounded-lg transition-opacity"
          >
            <Plus size={18} />
            Add Sublink
          </button>
        </div>

        {showAddForm && (
          <div className="mb-6 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">
                  Type
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="url"
                      checked={formData.type === 'url'}
                      onChange={(e) => {
                        setFormData({ ...formData, type: e.target.value })
                        setSelectedFile(null)
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">URL</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="file"
                      checked={formData.type === 'file'}
                      onChange={(e) => {
                        setFormData({ ...formData, type: e.target.value, url: '' })
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">File</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder={formData.type === 'file' ? 'resume' : 'sublink'}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  required
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Will redirect from: {window.location.origin}/{formData.slug}
                </p>
              </div>

              {formData.type === 'url' ? (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">
                    Destination
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://website/slug"
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">
                    Upload File
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/*,image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      required
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-8 bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                    >
                      {selectedFile ? (
                        <>
                          <FileText size={20} />
                          <span className="text-sm">{selectedFile.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload size={20} />
                          <span className="text-sm">Drop file here or click to upload (video, image, or PDF)</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploadProgress}
                  className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-80 rounded-lg transition-opacity disabled:opacity-50"
                >
                  {uploadProgress ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({ slug: '', url: '', type: 'url' })
                    setSelectedFile(null)
                  }}
                  className="px-4 py-2 text-sm font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:opacity-80 rounded-lg transition-opacity"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-zinc-600 dark:text-zinc-300">
            Loading sublinks...
          </div>
        ) : sublinks.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 dark:text-zinc-300">
            No sublinks yet. Click "Add Sublink" to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {sublinks.map((sublink) => (
              <SublinkItem
                key={sublink.id}
                sublink={sublink}
                isEditing={editingId === sublink.id}
                onEdit={() => setEditingId(sublink.id)}
                onCancelEdit={() => setEditingId(null)}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
        </div>
      </div>
      <ScrollToTop />
    </>
  )
}

const SublinkItem = ({
  sublink,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
}) => {
  const [editSlug, setEditSlug] = useState(sublink.slug)
  const [editUrl, setEditUrl] = useState(sublink.url)

  if (isEditing) {
    return (
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-200 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={editSlug}
              onChange={(e) => setEditSlug(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-200 mb-1">
              Destination URL
            </label>
            <input
              type="url"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate(sublink.id, editSlug, editUrl)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 rounded-lg transition-opacity"
            >
              <Check size={16} />
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:opacity-80 rounded-lg transition-opacity"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <code className="text-sm font-medium text-zinc-900 dark:text-white">
            /{sublink.slug}
          </code>
          {sublink.type === 'file' ? (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
              <FileText size={12} />
              FILE
            </span>
          ) : (
            <ExternalLink size={14} className="text-zinc-400" />
          )}
        </div>
        <a
          href={sublink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 truncate block"
        >
          {sublink.type === 'file' ? sublink.file_path : sublink.url}
        </a>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={onEdit}
          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-900 rounded-lg transition-colors"
          aria-label="Edit"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={() => onDelete(sublink.id)}
          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
          aria-label="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default Sublinks
