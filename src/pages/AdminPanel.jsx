import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import SublinksTab from '../components/admin/SublinksTab'
import PagesTab from '../components/admin/PagesTab'
import SettingsTab from '../components/admin/SettingsTab'
import ActivityGraph from '../components/ActivityGraph'

const AdminPanel = () => {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('pages')
  const [showStickyTitle, setShowStickyTitle] = useState(false)
  const titleRef = useRef(null)

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

  if (!user || !isAdmin()) {
    navigate('/')
    return null
  }

  return (
    <>
      {/* Sticky Title Header */}
      <div className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl transition-all duration-300 ${
        showStickyTitle ? 'translate-y-0 border-b border-zinc-200/50 dark:border-zinc-800/30' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <h1 className="text-base md:text-lg font-bold text-zinc-900 dark:text-white">
              Admin Panel
            </h1>
          </div>
        </div>
      </div>

      <div className="min-h-screen pt-24 px-4 md:px-6 pb-12 transition-colors">
        <div className="max-w-4xl mx-auto">
          <h1 ref={titleRef} className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-6 md:mb-8">
            Admin Panel
          </h1>

          {/* Activity Graph */}
          <div className="mb-6 md:mb-8">
            <ActivityGraph />
          </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 md:gap-4 mb-6 md:mb-8 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hide">
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-3 md:px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'pages'
                ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Pages
          </button>
          <button
            onClick={() => setActiveTab('sublinks')}
            className={`px-3 md:px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'sublinks'
                ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Sublinks
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 md:px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Settings
          </button>
        </div>

          {/* Tab Content */}
          {activeTab === 'pages' ? (
            <PagesTab />
          ) : activeTab === 'sublinks' ? (
            <SublinksTab />
          ) : (
            <SettingsTab />
          )}
        </div>
      </div>
    </>
  )
}

export default AdminPanel
