/**
 * Analytics utilities for tracking file views
 * Captures visitor information without requiring any permissions
 */

/**
 * Parse user agent string to extract device, browser, and OS info
 */
export function parseUserAgent(userAgent) {
  if (!userAgent) {
    return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' }
  }

  const ua = userAgent.toLowerCase()

  // Detect device type
  let deviceType = 'desktop'
  if (/bot|crawler|spider|crawling|curl|wget|python|axios|node-fetch|postman/i.test(userAgent)) {
    deviceType = 'bot'
  } else if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(userAgent)) {
    deviceType = 'mobile'
  } else if (/ipad|tablet|playbook|silk/i.test(userAgent)) {
    deviceType = 'tablet'
  }

  // Detect browser
  let browser = 'unknown'
  if (ua.includes('edg/')) browser = 'Edge'
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera'
  else if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome'
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari'
  else if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('msie') || ua.includes('trident')) browser = 'IE'
  else if (ua.includes('curl')) browser = 'curl'
  else if (ua.includes('wget')) browser = 'wget'
  else if (ua.includes('python')) browser = 'Python'

  // Detect OS
  let os = 'unknown'
  if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('mac os') || ua.includes('macos')) os = 'macOS'
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('linux')) os = 'Linux'
  else if (ua.includes('cros')) os = 'ChromeOS'

  return { deviceType, browser, os }
}

/**
 * Extract visitor information from request headers
 * Uses Vercel's automatic geo headers when available
 */
export function extractVisitorInfo(req) {
  const headers = req.headers || {}

  // Get IP address (Vercel provides these headers)
  const ip = headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             headers['x-real-ip'] ||
             req.socket?.remoteAddress ||
             null

  // Vercel geo headers (automatically populated on Vercel)
  const country = headers['x-vercel-ip-country'] || null
  const countryRegion = headers['x-vercel-ip-country-region'] || null
  const city = headers['x-vercel-ip-city'] ? decodeURIComponent(headers['x-vercel-ip-city']) : null
  const latitude = headers['x-vercel-ip-latitude'] ? parseFloat(headers['x-vercel-ip-latitude']) : null
  const longitude = headers['x-vercel-ip-longitude'] ? parseFloat(headers['x-vercel-ip-longitude']) : null

  // Standard headers
  const userAgent = headers['user-agent'] || null
  const referer = headers['referer'] || headers['referrer'] || null
  const acceptLanguage = headers['accept-language'] || null

  return {
    ip,
    country,
    countryRegion,
    city,
    latitude,
    longitude,
    userAgent,
    referer,
    acceptLanguage,
  }
}

/**
 * Track a file view in the database
 * This is fire-and-forget - errors are logged but don't block the response
 */
export async function trackFileView(supabase, { slug, filePath, req }) {
  const visitorInfo = extractVisitorInfo(req)
  const parsedUA = parseUserAgent(visitorInfo.userAgent)

  const viewData = {
    slug,
    file_path: filePath,
    ip_address: visitorInfo.ip,
    user_agent: visitorInfo.userAgent,
    referer: visitorInfo.referer,
    accept_language: visitorInfo.acceptLanguage,
    country: visitorInfo.country,
    country_region: visitorInfo.countryRegion,
    city: visitorInfo.city,
    latitude: visitorInfo.latitude,
    longitude: visitorInfo.longitude,
    device_type: parsedUA.deviceType,
    browser: parsedUA.browser,
    os: parsedUA.os,
  }

  const { error } = await supabase
    .from('file_views')
    .insert(viewData)

  if (error) {
    throw error
  }

  return viewData
}
