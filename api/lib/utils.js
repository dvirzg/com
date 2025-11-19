/**
 * Detect if request is from curl, wget, or automated tools
 * @param {string} userAgent - The user agent string from the request
 * @returns {boolean} True if the request is from an automated tool
 */
export function isAutomatedRequest(userAgent) {
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
