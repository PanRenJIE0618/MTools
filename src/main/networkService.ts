import { networkInterfaces } from 'node:os'
import { lookup } from 'node:dns/promises'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { performance } from 'node:perf_hooks'

export function listLocalAddresses(): { name: string; address: string; internal: boolean }[] {
  const nets = networkInterfaces()
  const out: { name: string; address: string; internal: boolean }[] = []
  for (const [name, entries] of Object.entries(nets)) {
    for (const e of entries ?? []) {
      if (e.family === 'IPv4') {
        out.push({ name, address: e.address, internal: e.internal })
      }
    }
  }
  return out
}

export async function resolveHost(host: string): Promise<{ ok: boolean; address?: string; error?: string }> {
  try {
    const r = await lookup(host)
    return { ok: true, address: r.address }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function httpLatency(
  url: string
): Promise<{ ok: boolean; ms?: number; status?: number; error?: string }> {
  return new Promise((resolve) => {
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      resolve({ ok: false, error: 'URL 无效' })
      return
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      resolve({ ok: false, error: '仅支持 http/https' })
      return
    }
    const lib = parsed.protocol === 'https:' ? httpsRequest : httpRequest
    const start = performance.now()
    const req = lib(
      parsed,
      { method: 'GET', timeout: 8000 },
      (res) => {
        res.resume()
        resolve({
          ok: true,
          ms: Math.round(performance.now() - start),
          status: res.statusCode
        })
      }
    )
    req.on('timeout', () => {
      req.destroy()
      resolve({ ok: false, error: '超时' })
    })
    req.on('error', (e) => resolve({ ok: false, error: e.message }))
    req.end()
  })
}

export async function translateText(
  text: string,
  from: string,
  to: string
): Promise<{ ok: boolean; text?: string; error?: string }> {
  try {
    const q = encodeURIComponent(text.slice(0, 500))
    const langpair = `${from}|${to}`
    const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=${langpair}`
    const res = await fetch(url)
    const data = (await res.json()) as {
      responseData?: { translatedText?: string }
      responseStatus?: number
    }
    const translated = data.responseData?.translatedText
    if (!translated) return { ok: false, error: '翻译失败' }
    return { ok: true, text: translated }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
