import { useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

// Generate a unique session ID
const generateSessionId = () => {
  return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

// Get or create session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = generateSessionId()
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

// Check if this is the first page of the session
const isFirstPageOfSession = () => {
  const hasVisited = sessionStorage.getItem('analytics_has_visited')
  if (!hasVisited) {
    sessionStorage.setItem('analytics_has_visited', 'true')
    return true
  }
  return false
}

// Track API call
const trackPage = async (data) => {
  try {
    const response = await fetch('/api/track-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      // Use keepalive for exit events to ensure they complete
      keepalive: data.action === 'exit',
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (err) {
    // Silently fail - don't break user experience for analytics
    console.debug('Analytics tracking failed:', err)
  }
  return null
}

export const usePageTracking = () => {
  const location = useLocation()
  const pageViewIdRef = useRef(null)
  const enterTimeRef = useRef(null)
  const previousPageRef = useRef(null)
  const heartbeatIntervalRef = useRef(null)

  // Record page exit
  const recordExit = useCallback(async (isHeartbeat = false) => {
    if (!pageViewIdRef.current || !enterTimeRef.current) return

    const timeOnPageMs = Date.now() - enterTimeRef.current

    await trackPage({
      action: isHeartbeat ? 'heartbeat' : 'exit',
      sessionId: getSessionId(),
      pagePath: location.pathname,
      pageViewId: pageViewIdRef.current,
      timeOnPageMs,
    })
  }, [location.pathname])

  // Record page enter
  const recordEnter = useCallback(async () => {
    const sessionId = getSessionId()
    const isEntryPage = isFirstPageOfSession()

    enterTimeRef.current = Date.now()

    const result = await trackPage({
      action: 'enter',
      sessionId,
      pagePath: location.pathname,
      referrer: isEntryPage ? document.referrer : null,
      previousPage: previousPageRef.current,
      isEntryPage,
    })

    if (result?.pageViewId) {
      pageViewIdRef.current = result.pageViewId
    }

    // Start heartbeat to periodically update time on page
    // This helps capture time even if the user closes the tab abruptly
    heartbeatIntervalRef.current = setInterval(() => {
      recordExit(true) // heartbeat
    }, 30000) // every 30 seconds
  }, [location.pathname, recordExit])

  useEffect(() => {
    // Skip tracking for admin pages
    if (location.pathname.startsWith('/admin') || location.pathname === '/login') {
      return
    }

    // Record enter
    recordEnter()

    // Handle visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordExit(true) // heartbeat on hide
      }
    }

    // Handle page unload
    const handleBeforeUnload = () => {
      recordExit(false) // final exit
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup on route change or unmount
    return () => {
      // Record exit for current page
      recordExit(false)

      // Clear heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }

      // Store current page as previous for next page
      previousPageRef.current = location.pathname

      // Reset refs for next page
      pageViewIdRef.current = null
      enterTimeRef.current = null

      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [location.pathname, recordEnter, recordExit])
}

export default usePageTracking
