import { useState, useEffect } from 'react'
import { Plus, ExternalLink, Trash2, Edit2, Check, X, FileText, Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const SublinksTab = () => {
  const [sublinks, setSublinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ slug: '', url: '', type: 'url' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(false)

  useEffect(() => {
    fetchSublinks()
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

    // Handle PDF upload
    if (formData.type === 'pdf' && selectedFile) {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${formData.slug.toLowerCase().replace(/\s+/g, '-')}.${fileExt}`
      filePath = `pdfs/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('sublinks')
        .upload(filePath, selectedFile, { upsert: true })

      if (uploadError) {
        alert('Error uploading PDF: ' + uploadError.message)
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

    const { error } = await supabase.from('sublinks').insert([
      {
        slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
        url: finalUrl,
        type: formData.type,
        file_path: filePath,
      },
    ])

    if (error) {
      alert('Error creating sublink: ' + error.message)
    } else {
      setFormData({ slug: '', url: '', type: 'url' })
      setSelectedFile(null)
      setShowAddForm(false)
      fetchSublinks()
    }
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

    // Delete file from storage if it exists
    if (sublink?.file_path) {
      await supabase.storage.from('sublinks').remove([sublink.file_path])
    }

    const { error } = await supabase.from('sublinks').delete().eq('id', id)

    if (error) {
      alert('Error deleting sublink: ' + error.message)
    } else {
      fetchSublinks()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      alert('Please select a PDF file')
      e.target.value = ''
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Create short URLs that redirect to external links or PDFs
        </p>
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
                      value="pdf"
                      checked={formData.type === 'pdf'}
                      onChange={(e) => {
                        setFormData({ ...formData, type: e.target.value, url: '' })
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">PDF</span>
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
                  placeholder={formData.type === 'pdf' ? 'resume' : 'sublink'}
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
                    Upload PDF
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdf-upload"
                      required
                    />
                    <label
                      htmlFor="pdf-upload"
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
                          <span className="text-sm">Drop PDF here or click to upload</span>
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
          {sublink.type === 'pdf' ? (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
              <FileText size={12} />
              PDF
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
          {sublink.type === 'pdf' ? sublink.file_path : sublink.url}
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

export default SublinksTab
