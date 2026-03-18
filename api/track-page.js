import { createClient } from '@supabase/supabase-js'
import { parseUserAgent, extractVisitorInfo } from './lib/analytics.js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      action, // 'enter' | 'exit' | 'heartbeat'
      sessionId,
      pagePath,
      pageViewId, // for exit/heartbeat updates
      referrer,
      previousPage,
      timeOnPageMs,
      isEntryPage,
    } = req.body

    if (!sessionId || !pagePath) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    if (action === 'enter') {
      // Extract visitor info from request headers (server-side)
      const visitorInfo = extractVisitorInfo(req)
      const parsedUA = parseUserAgent(visitorInfo.userAgent)

      const { data, error } = await supabase
        .from('page_views')
        .insert({
          session_id: sessionId,
          page_path: pagePath,
          referrer: referrer || null,
          previous_page: previousPage || null,
          is_entry_page: isEntryPage || false,
          ip_address: visitorInfo.ip,
          user_agent: visitorInfo.userAgent,
          accept_language: visitorInfo.acceptLanguage,
          country: visitorInfo.country,
          country_region: visitorInfo.countryRegion,
          city: visitorInfo.city,
          device_type: parsedUA.deviceType,
          browser: parsedUA.browser,
          os: parsedUA.os,
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error recording page enter:', error)
        return res.status(500).json({ error: 'Failed to record page view' })
      }

      return res.status(200).json({ pageViewId: data.id })
    }

    if (action === 'exit' || action === 'heartbeat') {
      if (!pageViewId) {
        return res.status(400).json({ error: 'Missing pageViewId for exit/heartbeat' })
      }

      const updateData = {
        exited_at: new Date().toISOString(),
        time_on_page_ms: timeOnPageMs || 0,
      }

      // Only mark as exit page on actual exit, not heartbeat
      if (action === 'exit') {
        updateData.is_exit_page = true
      }

      const { error } = await supabase
        .from('page_views')
        .update(updateData)
        .eq('id', pageViewId)

      if (error) {
        console.error('Error updating page exit:', error)
        return res.status(500).json({ error: 'Failed to update page view' })
      }

      return res.status(200).json({ success: true })
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (err) {
    console.error('Track page error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
