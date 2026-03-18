import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Users, Clock, MousePointer, Globe, Monitor, Smartphone, Tablet, Bot, ArrowRight, ExternalLink, X, Filter } from 'lucide-react'

const AnalyticsTab = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sessions, setSessions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)

  // Get filters from URL
  const filters = {
    ip: searchParams.get('ip'),
    country: searchParams.get('country'),
    device: searchParams.get('device'),
    referrer: searchParams.get('referrer'),
    page: searchParams.get('page'),
  }
  const hasFilters = Object.values(filters).some(Boolean)

  // Set a filter
  const setFilter = useCallback((key, value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    setSearchParams(newParams, { replace: true })
  }, [searchParams, setSearchParams])

  // Clear a specific filter
  const clearFilter = useCallback((key) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete(key)
    setSearchParams(newParams, { replace: true })
  }, [searchParams, setSearchParams])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('ip')
    newParams.delete('country')
    newParams.delete('device')
    newParams.delete('referrer')
    newParams.delete('page')
    setSearchParams(newParams, { replace: true })
  }, [searchParams, setSearchParams])

  // Handle Escape key to clear filters
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && hasFilters) {
        clearAllFilters()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hasFilters, clearAllFilters])

  useEffect(() => {
    fetchAnalytics()
  }, [filters.ip, filters.country, filters.device, filters.referrer, filters.page])

  const fetchAnalytics = async () => {
    setLoading(true)

    // Build query with filters
    let query = supabase
      .from('page_views')
      .select('*')
      .order('entered_at', { ascending: false })
      .limit(500)

    if (filters.ip) {
      query = query.eq('ip_address', filters.ip)
    }
    if (filters.country) {
      query = query.eq('country', filters.country)
    }
    if (filters.device) {
      query = query.eq('device_type', filters.device)
    }
    if (filters.page) {
      query = query.eq('page_path', filters.page)
    }
    // Referrer filter is handled client-side after fetching (since we match by hostname)

    const { data, error } = await query

    if (!error && data) {
      // Group by session
      const sessionMap = new Map()
      data.forEach(view => {
        if (!sessionMap.has(view.session_id)) {
          sessionMap.set(view.session_id, {
            sessionId: view.session_id,
            views: [],
            entryPage: null,
            exitPage: null,
            startTime: null,
            endTime: null,
            totalTimeMs: 0,
            country: view.country,
            city: view.city,
            device: view.device_type,
            browser: view.browser,
            os: view.os,
            ipAddress: view.ip_address,
            referrerHostname: null,
          })
        }
        const session = sessionMap.get(view.session_id)
        session.views.push(view)
        session.totalTimeMs += view.time_on_page_ms || 0

        if (view.is_entry_page) {
          session.entryPage = view.page_path
          session.referrer = view.referrer
          // Extract hostname for filtering
          if (view.referrer) {
            try {
              session.referrerHostname = new URL(view.referrer).hostname
            } catch {
              session.referrerHostname = view.referrer
            }
          }
        }
        if (view.is_exit_page) {
          session.exitPage = view.page_path
        }

        const enteredAt = new Date(view.entered_at)
        if (!session.startTime || enteredAt < session.startTime) {
          session.startTime = enteredAt
        }
        const exitedAt = view.exited_at ? new Date(view.exited_at) : enteredAt
        if (!session.endTime || exitedAt > session.endTime) {
          session.endTime = exitedAt
        }
      })

      let sessionsArray = Array.from(sessionMap.values())
        .sort((a, b) => b.startTime - a.startTime)

      // Client-side filter for referrer (by hostname)
      if (filters.referrer) {
        sessionsArray = sessionsArray.filter(s => s.referrerHostname === filters.referrer)
      }

      setSessions(sessionsArray)
      calculateStats(sessionsArray, data)
    }

    setLoading(false)
  }

  const calculateStats = (sessionsArray, allViews) => {
    const now = new Date()
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

    const last24h = sessionsArray.filter(s => s.startTime > oneDayAgo)
    const lastWeek = sessionsArray.filter(s => s.startTime > oneWeekAgo)

    // Average time on site
    const avgTimeMs = sessionsArray.length > 0
      ? sessionsArray.reduce((sum, s) => sum + s.totalTimeMs, 0) / sessionsArray.length
      : 0

    // Pages per session
    const avgPages = sessionsArray.length > 0
      ? sessionsArray.reduce((sum, s) => sum + s.views.length, 0) / sessionsArray.length
      : 0

    // Top pages
    const pageCounts = allViews.reduce((acc, v) => {
      acc[v.page_path] = (acc[v.page_path] || 0) + 1
      return acc
    }, {})
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Top referrers (from sessions, not views, to get unique entry referrers)
    const referrerCounts = sessionsArray.reduce((acc, s) => {
      if (s.referrerHostname) {
        acc[s.referrerHostname] = (acc[s.referrerHostname] || 0) + 1
      }
      return acc
    }, {})
    const topReferrers = Object.entries(referrerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Top countries
    const countryCounts = sessionsArray.reduce((acc, s) => {
      const country = s.country || 'Unknown'
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {})
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Device breakdown
    const deviceCounts = sessionsArray.reduce((acc, s) => {
      const device = s.device || 'desktop'
      acc[device] = (acc[device] || 0) + 1
      return acc
    }, {})
    const devices = Object.entries(deviceCounts)
      .sort((a, b) => b[1] - a[1])

    setStats({
      totalSessions: sessionsArray.length,
      last24h: last24h.length,
      lastWeek: lastWeek.length,
      avgTimeMs,
      avgPages,
      topPages,
      topReferrers,
      topCountries,
      devices,
    })
  }

  const formatDuration = (ms) => {
    if (!ms) return '0s'
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const formatTime = (date) => {
    if (!date) return ''
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`

    return date.toLocaleDateString()
  }

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile': return <Smartphone size={14} />
      case 'tablet': return <Tablet size={14} />
      case 'bot': return <Bot size={14} />
      default: return <Monitor size={14} />
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-zinc-500">Loading analytics...</div>
  }

  // Filter chip component
  const FilterChip = ({ label, value, filterKey }) => (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm">
      <span className="text-blue-600 dark:text-blue-400 text-xs">{label}:</span>
      <span className="font-medium truncate max-w-[150px]">{value}</span>
      <button
        onClick={(e) => { e.stopPropagation(); clearFilter(filterKey) }}
        className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full transition-colors"
      >
        <X size={12} />
      </button>
    </span>
  )

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Filter size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-800 dark:text-blue-200 mr-1">Filters:</span>
          {filters.ip && <FilterChip label="IP" value={filters.ip} filterKey="ip" />}
          {filters.country && <FilterChip label="Country" value={filters.country} filterKey="country" />}
          {filters.device && <FilterChip label="Device" value={filters.device} filterKey="device" />}
          {filters.referrer && <FilterChip label="Referrer" value={filters.referrer} filterKey="referrer" />}
          {filters.page && <FilterChip label="Page" value={filters.page} filterKey="page" />}
          <button
            onClick={clearAllFilters}
            className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
              <Users size={16} />
              <span className="text-xs">Sessions (24h)</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
              {stats.last24h}
            </div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
              <Users size={16} />
              <span className="text-xs">Sessions (7d)</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
              {stats.lastWeek}
            </div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
              <Clock size={16} />
              <span className="text-xs">Avg. Time</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
              {formatDuration(stats.avgTimeMs)}
            </div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
              <MousePointer size={16} />
              <span className="text-xs">Pages/Session</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
              {stats.avgPages.toFixed(1)}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Pages */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">
              Top Pages
            </h3>
            <div className="space-y-1">
              {stats.topPages.map(([path, count]) => (
                <div
                  key={path}
                  onClick={() => setFilter('page', path)}
                  className="flex items-center justify-between text-sm p-1.5 -mx-1.5 rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
                >
                  <span className="text-zinc-600 dark:text-zinc-300 truncate max-w-[180px]">
                    {path}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-white">{count}</span>
                </div>
              ))}
              {stats.topPages.length === 0 && (
                <div className="text-zinc-500 text-sm">No data yet</div>
              )}
            </div>
          </div>

          {/* Top Referrers */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <ExternalLink size={14} />
              Top Referrers
            </h3>
            <div className="space-y-1">
              {stats.topReferrers.map(([referrer, count]) => (
                <div
                  key={referrer}
                  onClick={() => setFilter('referrer', referrer)}
                  className="flex items-center justify-between text-sm p-1.5 -mx-1.5 rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
                >
                  <span className="text-zinc-600 dark:text-zinc-300 truncate max-w-[180px]">
                    {referrer}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-white">{count}</span>
                </div>
              ))}
              {stats.topReferrers.length === 0 && (
                <div className="text-zinc-500 text-sm">No external referrers yet</div>
              )}
            </div>
          </div>

          {/* Top Countries */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <Globe size={14} />
              Countries
            </h3>
            <div className="space-y-1">
              {stats.topCountries.map(([country, count]) => (
                <div
                  key={country}
                  onClick={() => country !== 'Unknown' && setFilter('country', country)}
                  className={`flex items-center justify-between text-sm p-1.5 -mx-1.5 rounded transition-colors ${
                    country !== 'Unknown' ? 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50' : ''
                  }`}
                >
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {country}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-white">{count}</span>
                </div>
              ))}
              {stats.topCountries.length === 0 && (
                <div className="text-zinc-500 text-sm">No data yet</div>
              )}
            </div>
          </div>

          {/* Devices */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">
              Devices
            </h3>
            <div className="space-y-1">
              {stats.devices.map(([device, count]) => (
                <div
                  key={device}
                  onClick={() => setFilter('device', device)}
                  className="flex items-center justify-between text-sm p-1.5 -mx-1.5 rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    {getDeviceIcon(device)}
                    <span className="capitalize">{device}</span>
                  </div>
                  <span className="font-medium text-zinc-900 dark:text-white">{count}</span>
                </div>
              ))}
              {stats.devices.length === 0 && (
                <div className="text-zinc-500 text-sm">No data yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div>
        <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">
          {hasFilters ? 'Filtered Sessions' : 'Recent Sessions'}
          {sessions.length > 0 && <span className="text-zinc-500 font-normal ml-2">({sessions.length})</span>}
        </h3>
        <div className="space-y-2">
          {sessions.slice(0, 20).map((session) => (
            <div
              key={session.sessionId}
              className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => setSelectedSession(selectedSession === session.sessionId ? null : session.sessionId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(session.device)}
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-white">
                      {session.city && session.country
                        ? `${session.city}, ${session.country}`
                        : session.country || 'Unknown location'}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {session.browser} on {session.os} · {session.views.length} page{session.views.length !== 1 ? 's' : ''} · {formatDuration(session.totalTimeMs)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatTime(session.startTime)}
                </div>
              </div>

              {/* Expanded session details */}
              {selectedSession === session.sessionId && (
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {session.ipAddress && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setFilter('ip', session.ipAddress) }}
                        className="text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded transition-colors"
                      >
                        Filter by this IP
                      </button>
                    )}
                    {session.country && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setFilter('country', session.country) }}
                        className="text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded transition-colors"
                      >
                        Filter by {session.country}
                      </button>
                    )}
                    {session.referrerHostname && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setFilter('referrer', session.referrerHostname) }}
                        className="text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded transition-colors"
                      >
                        Filter by {session.referrerHostname}
                      </button>
                    )}
                  </div>
                  {session.referrer && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                      Came from: {session.referrerHostname || session.referrer}
                    </div>
                  )}
                  <div className="space-y-1">
                    {session.views
                      .sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at))
                      .map((view, idx) => (
                        <div key={view.id} className="flex items-center gap-2 text-sm">
                          <span className="text-zinc-400">{idx + 1}.</span>
                          <span className="text-zinc-700 dark:text-zinc-300">{view.page_path}</span>
                          {view.time_on_page_ms > 0 && (
                            <span className="text-xs text-zinc-500">
                              ({formatDuration(view.time_on_page_ms)})
                            </span>
                          )}
                          {view.is_entry_page && (
                            <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                              entry
                            </span>
                          )}
                          {view.is_exit_page && (
                            <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                              exit
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              {hasFilters
                ? 'No sessions match the current filters.'
                : 'No sessions recorded yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsTab
