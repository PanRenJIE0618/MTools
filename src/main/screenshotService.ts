import { desktopCapturer, nativeImage } from 'electron'
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

export type ScreenSource = {
  id: string
  name: string
  thumbnailDataUrl: string
}

export async function listScreenSources(): Promise<ScreenSource[]> {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 320, height: 180 },
    fetchWindowIcons: false
  })
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    thumbnailDataUrl: s.thumbnail.toDataURL()
  }))
}

export async function captureScreenDataUrl(
  sourceId: string
): Promise<{ ok: boolean; error?: string; dataUrl?: string }> {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 2560, height: 1440 }
    })
    const source = sources.find((s) => s.id === sourceId) ?? sources[0]
    if (!source || source.thumbnail.isEmpty()) {
      return { ok: false, error: '无法获取屏幕画面' }
    }
    return { ok: true, dataUrl: source.thumbnail.toDataURL() }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function captureScreenPng(
  sourceId: string,
  savePath: string
): Promise<{ ok: boolean; error?: string; path?: string }> {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 2560, height: 1440 }
    })
    const source = sources.find((s) => s.id === sourceId) ?? sources[0]
    if (!source || source.thumbnail.isEmpty()) {
      return { ok: false, error: '无法获取屏幕画面' }
    }
    await mkdir(dirname(savePath), { recursive: true })
    const png = source.thumbnail.toPNG()
    await writeFile(savePath, png)
    return { ok: true, path: savePath }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export function dataUrlToBuffer(dataUrl: string): Buffer | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl)
  if (!m) return null
  return Buffer.from(m[2], 'base64')
}

export function isValidImageBuffer(buf: Buffer): boolean {
  return !nativeImage.createFromBuffer(buf).isEmpty()
}
