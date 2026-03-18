import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, Clock, MousePointer, Globe, Monitor, Smartphone, Tablet, Bot, ArrowRight, ExternalLink } from 'lucide-react'

const AnalyticsTab = () => {
  const [sessions, setSessions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)

    // Fetch recent page views grouped by session
    const { data, error } = await supabase
      .from('page_views')
      .select('*')
      .order('entered_at', { ascending: false })
      .limit(500)

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
          })
        }
        const session = sessionMap.get(view.session_id)
        session.views.push(view)
        session.totalTimeMs += view.time_on_page_ms || 0

        if (view.is_entry_page) {
          session.entryPage = view.page_path
          session.referrer = view.referrer
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

      const sessionsArray = Array.from(sessionMap.values())
        .sort((a, b) => b.startTime - a.startTime)

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

    // Top referrers
    const referrerCounts = allViews.reduce((acc, v) => {
      if (v.referrer && v.is_entry_page) {
        try {
          const domain = new URL(v.referrer).hostname
          acc[domain] = (acc[domain] || 0) + 1
        } catch {
          acc[v.referrer] = (acc[v.referrer] || 0) + 1
        }
      }
      return acc
    }, {})
    const topReferrers = Object.entries(referrerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    setStats({
      totalSessions: sessionsArray.length,
      last24h: last24h.length,
      lastWeek: lastWeek.length,
      avgTimeMs,
      avgPages,
      topPages,
      topReferrers,
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

  return (
    <div className="space-y-6">
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

      {/* Top Pages & Referrers */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">
              Top Pages
            </h3>
            <div className="space-y-2">
              {stats.topPages.map(([path, count]) => (
                <div key={path} className="flex items-center justify-between text-sm">
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

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <ExternalLink size={14} />
              Top Referrers
            </h3>
            <div className="space-y-2">
              {stats.topReferrers.map(([referrer, count]) => (
                <div key={referrer} className="flex items-center justify-between text-sm">
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
        </div>
      )}

      {/* Recent Sessions */}
      <div>
        <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">
          Recent Sessions
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
                  {session.referrer && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                      Came from: {(() => {
                        try {
                          return new URL(session.referrer).hostname
                        } catch {
                          return session.referrer
                        }
                      })()}
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
              No sessions recorded yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsTab
