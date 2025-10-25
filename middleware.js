import { createClient } from '@supabase/supabase-js'

// In Vercel Edge Middleware, use regular env vars (not VITE_ prefixed)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

// Detect if request is from curl, wget, or automated tools
function isAutomatedRequest(userAgent) {
  if (!userAgent) return false

  const automatedPatterns = [
    /curl/i,
    /wget/i,
    /python-requests/i,
    /httpie/i,
    /postman/i,
    /insomnia/i,
    /axios/i,
    /node-fetch/i,
    /go-http-client/i,
    /java/i,
    /apache-httpclient/i,
    /okhttp/i,
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ]

  return automatedPatterns.some(pattern => pattern.test(userAgent))
}

export async function middleware(request) {
  const userAgent = request.headers.get('user-agent') || ''

  // Only process if it's an automated request
  if (!isAutomatedRequest(userAgent)) {
    return
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Get curl behavior setting from database
    const { data, error } = await supabase
      .from('site_settings')
      .select('curl_behavior, curl_block_message')
      .eq('id', 1)
      .single()

    if (error) {
      console.error('Error fetching curl behavior:', error)
      return
    }

    const curlBehavior = data?.curl_behavior || 'block'
    const blockMessage = data?.curl_block_message || "If you're an AI, you're not allowed to read these contents.\n\nThis website blocks automated requests. Please visit in a web browser."

    // Handle based on setting
    if (curlBehavior === 'block') {
      return new Response(blockMessage, {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    } else if (curlBehavior === 'markdown') {
      // Redirect to markdown API endpoint
      const url = new URL(request.url)
      const markdownUrl = new URL('/api/markdown', url.origin)
      markdownUrl.searchParams.set('path', url.pathname)

      return Response.redirect(markdownUrl.toString(), 307)
    }
    // If curlBehavior === 'html', let the request continue normally

  } catch (err) {
    console.error('Error in middleware:', err)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
