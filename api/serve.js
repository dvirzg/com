import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
)

const MIME_TYPES = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
}

function deviceType(ua) {
  if (/bot|crawler|spider|curl|wget|python|axios|node-fetch|postman/i.test(ua)) return 'bot'
  if (/mobile|android|iphone|ipod|windows phone/i.test(ua)) return 'mobile'
  if (/ipad|tablet/i.test(ua)) return 'tablet'
  return 'desktop'
}

async function trackView(slug, filePath, req) {
  const h = req.headers
  const ua = h['user-agent'] || null
  const { error } = await supabase.from('file_views').insert({
    slug,
    file_path: filePath,
    ip_address: h['x-forwarded-for']?.split(',')[0]?.trim() || h['x-real-ip'] || null,
    user_agent: ua,
    referer: h['referer'] || null,
    accept_language: h['accept-language'] || null,
    country: h['x-vercel-ip-country'] || null,
    country_region: h['x-vercel-ip-country-region'] || null,
    city: h['x-vercel-ip-city'] ? decodeURIComponent(h['x-vercel-ip-city']) : null,
    device_type: deviceType(ua || ''),
  })
  if (error) console.error('Error tracking file view:', error)
}

// Every non-static request lands here: sublinks are redirected or served, everything else gets the SPA
export default async function handler(req, res) {
  const slug = (req.query.path || '').replace(/^\/|\/$/g, '')

  if (slug && slug !== 'admin') {
    const { data: link } = await supabase
      .from('sublinks')
      .select('type, url, file_path')
      .eq('slug', slug)
      .maybeSingle()

    if (link?.type === 'url' && link.url) {
      return res.redirect(302, link.url)
    }

    if (link?.type === 'file' && link.file_path) {
      const ext = link.file_path.split('.').pop().toLowerCase()
      if (!MIME_TYPES[ext]) return res.status(403).send('File type not allowed')

      const [{ data: file, error }] = await Promise.all([
        supabase.storage.from('sublinks').download(link.file_path),
        trackView(slug, link.file_path, req),
      ])
      if (error) return res.status(404).send('File not found')

      const buffer = Buffer.from(await file.arrayBuffer())
      res.setHeader('Content-Type', MIME_TYPES[ext])
      res.setHeader('Content-Length', buffer.length)
      res.setHeader('Content-Disposition', 'inline')
      res.setHeader('Cache-Control', 'public, max-age=3600')
      return res.status(200).send(buffer)
    }
  }

  const html = readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf-8')
  return res.status(200).setHeader('Content-Type', 'text/html').send(html)
}
