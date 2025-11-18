export const isTwitterUrl = (url) => {
  return url && (url.includes('twitter.com') || url.includes('x.com')) && url.includes('/status/')
}
