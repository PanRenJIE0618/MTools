export function assertSafeUrl(raw: string): string {
  const u = new URL(raw)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('仅支持 http/https 链接')
  }
  return u.toString()
}
