import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { logger } from '../../lib/logger'
import ConfirmDialog from '../ConfirmDialog'

const PagesTab = () => {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, pageId: null, pageTitle: '' })

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .order('nav_order', { ascending: true })

    if (error) {
      logger.error('Error fetching pages:', error)
    } else {
      setPages(data || [])
    }
    setLoading(false)
  }

  const handleToggleNav = async (id, currentShowInNav) => {
    const { error } = await supabase
      .from('pages')
      .update({ show_in_nav: !currentShowInNav })
      .eq('id', id)

    if (error) {
      alert('Error updating page: ' + error.message)
    } else {
      fetchPages()
    }
  }

  const handleDeleteClick = (pageId, pageTitle) => {
    setDeleteDialog({ isOpen: true, pageId, pageTitle })
  }

  const handleDeleteConfirm = async () => {
    if (deleteDialog.pageId) {
      const { error} = await supabase
        .from('pages')
        .delete()
        .eq('id', deleteDialog.pageId)

      if (error) {
        alert('Failed to delete page: ' + error.message)
      } else {
        fetchPages()
      }
    }
    setDeleteDialog({ isOpen: false, pageId: null, pageTitle: '' })
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, pageId: null, pageTitle: '' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Create and manage custom pages that appear in your site navigation
        </p>
        <Link
          to="/admin/pages/new"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-80 rounded-lg transition-opacity"
        >
          <Plus size={18} />
          New Page
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-600 dark:text-zinc-300">
          Loading pages...
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-12 text-zinc-600 dark:text-zinc-300">
          No pages yet. Click "New Page" to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <GripVertical size={16} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-zinc-900 dark:text-white">
                      {page.title}
                    </h3>
                    {!page.show_in_nav && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                  <code className="text-sm text-zinc-600 dark:text-zinc-400">
                    /{page.slug}
                  </code>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleToggleNav(page.id, page.show_in_nav)}
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title={page.show_in_nav ? 'Hide from navigation' : 'Show in navigation'}
                >
                  {page.show_in_nav ? (
                    <Eye size={16} className="text-zinc-600 dark:text-zinc-400" />
                  ) : (
                    <EyeOff size={16} className="text-zinc-600 dark:text-zinc-400" />
                  )}
                </button>
                <Link
                  to={`/admin/pages/edit/${page.slug}`}
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Edit page"
                >
                  <Edit size={16} className="text-zinc-600 dark:text-zinc-400" />
                </Link>
                <button
                  onClick={() => handleDeleteClick(page.id, page.title)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                  title="Delete page"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Page"
        message={`Are you sure you want to delete "${deleteDialog.pageTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}

export default PagesTab
