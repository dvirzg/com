import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import SublinksTab from '../components/admin/SublinksTab'
import PagesTab from '../components/admin/PagesTab'

const AdminPanel = () => {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('pages')

  if (!user || !isAdmin()) {
    navigate('/')
    return null
  }

  return (
    <div className="min-h-screen pt-24 px-6 pb-12 bg-white dark:bg-black transition-colors">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-8">
          Admin Panel
        </h1>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pages'
                ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Pages
          </button>
          <button
            onClick={() => setActiveTab('sublinks')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sublinks'
                ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Sublinks
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'pages' ? <PagesTab /> : <SublinksTab />}
      </div>
    </div>
  )
}

export default AdminPanel
