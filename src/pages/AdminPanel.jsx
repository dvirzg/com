import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import SublinksTab from '../components/admin/SublinksTab'
import PagesTab from '../components/admin/PagesTab'
import SettingsTab from '../components/admin/SettingsTab'
import AnalyticsTab from '../components/admin/AnalyticsTab'
import ActivityGraph from '../components/ActivityGraph'

const VALID_TABS = ['pages', 'sublinks', 'analytics', 'settings']

const AdminPanel = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, isAdmin } = useAuth()

  // Derive active tab directly from URL (not state) so it updates when URL changes
  const tabFromUrl = searchParams.get('tab')
  const activeTab = VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'pages'

  const [showStickyTitle, setShowStickyTitle] = useState(false)
  const titleRef = useRef(null)

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', tab)
    // Remove ip filter when switching away from analytics
    if (tab !== 'analytics') {
      newParams.delete('ip')
    }
    // Remove analytics slug when switching away from sublinks
    if (tab !== 'sublinks') {
      newParams.delete('analytics')
    }
    setSearchParams(newParams, { replace: true })
  }

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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">
              Admin Panel
            </h1>
          </div>
        </div>
      </div>

      <div className="min-h-screen pt-24 px-6 pb-12 transition-colors">
        <div className="max-w-4xl mx-auto">
          <h1 ref={titleRef} className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-8">
            Admin Panel
          </h1>

          {/* Activity Graph */}
          <div className="mb-8">
            <ActivityGraph />
          </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => handleTabChange('pages')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pages'
                ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Pages
          </button>
          <button
            onClick={() => handleTabChange('sublinks')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sublinks'
                ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Sublinks
          </button>
          <button
            onClick={() => handleTabChange('analytics')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => handleTabChange('settings')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
          ) : activeTab === 'analytics' ? (
            <AnalyticsTab />
          ) : (
            <SettingsTab />
          )}
        </div>
      </div>
    </>
  )
}

export default AdminPanel
