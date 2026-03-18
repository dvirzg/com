import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Eye, Globe, Monitor, Smartphone, Tablet, Bot, Clock, MapPin, ArrowRight } from 'lucide-react'

const FileViewsAnalytics = ({ slug, onClose }) => {
  const [views, setViews] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchViews()
  }, [slug])

  const fetchViews = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('file_views')
      .select('*')
      .eq('slug', slug)
      .order('viewed_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setViews(data)
      calculateStats(data)
    }
    setLoading(false)
  }

  const calculateStats = (data) => {
    if (!data.length) {
      setStats(null)
      return
    }

    const now = new Date()
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

    const last24h = data.filter(v => new Date(v.viewed_at) > oneDayAgo).length
    const lastWeek = data.filter(v => new Date(v.viewed_at) > oneWeekAgo).length

    // Count by device type
    const devices = data.reduce((acc, v) => {
      const device = v.device_type || 'unknown'
      acc[device] = (acc[device] || 0) + 1
      return acc
    }, {})

    // Count by country
    const countries = data.reduce((acc, v) => {
      const country = v.country || 'Unknown'
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {})

    // Top referrers
    const referrers = data.reduce((acc, v) => {
      if (v.referer) {
        try {
          const url = new URL(v.referer)
          const domain = url.hostname
          acc[domain] = (acc[domain] || 0) + 1
        } catch {
          acc[v.referer] = (acc[v.referer] || 0) + 1
        }
      }
      return acc
    }, {})

    setStats({
      total: data.length,
      last24h,
      lastWeek,
      devices,
      countries: Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 5),
      referrers: Object.entries(referrers).sort((a, b) => b[1] - a[1]).slice(0, 5),
    })
  }

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile': return <Smartphone size={14} />
      case 'tablet': return <Tablet size={14} />
      case 'bot': return <Bot size={14} />
      default: return <Monitor size={14} />
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`

    return date.toLocaleDateString()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Analytics for /{slug}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              View statistics and visitor information
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-6">
          {loading ? (
            <div className="text-center py-12 text-zinc-500">Loading analytics...</div>
          ) : !stats ? (
            <div className="text-center py-12 text-zinc-500">
              <Eye size={48} className="mx-auto mb-4 opacity-50" />
              <p>No views yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {stats.total}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">Total views</div>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {stats.last24h}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">Last 24h</div>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {stats.lastWeek}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">Last 7 days</div>
                </div>
              </div>

              {/* Devices & Countries */}
              <div className="grid grid-cols-2 gap-4">
                {/* Devices */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">
                    Devices
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(stats.devices).map(([device, count]) => (
                      <div key={device} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                          {getDeviceIcon(device)}
                          <span className="capitalize">{device}</span>
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Countries */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                    <Globe size={14} />
                    Top Countries
                  </h3>
                  <div className="space-y-2">
                    {stats.countries.map(([country, count]) => (
                      <div key={country} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600 dark:text-zinc-300">{country}</span>
                        <span className="font-medium text-zinc-900 dark:text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Referrers */}
              {stats.referrers.length > 0 && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                    <ArrowRight size={14} />
                    Top Referrers
                  </h3>
                  <div className="space-y-2">
                    {stats.referrers.map(([referrer, count]) => (
                      <div key={referrer} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600 dark:text-zinc-300 truncate max-w-[200px]">
                          {referrer}
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Views */}
              <div>
                <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                  <Clock size={14} />
                  Recent Views
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {views.slice(0, 20).map((view) => (
                    <div
                      key={view.id}
                      className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(view.device_type)}
                        <div>
                          <div className="text-zinc-900 dark:text-white">
                            {view.city && view.country
                              ? `${view.city}, ${view.country}`
                              : view.country || 'Unknown location'}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {view.browser} on {view.os}
                            {view.referer && (() => {
                              try {
                                return <span> · from {new URL(view.referer).hostname}</span>
                              } catch {
                                return null
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="text-zinc-500 dark:text-zinc-400 text-xs">
                        {formatDate(view.viewed_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileViewsAnalytics
