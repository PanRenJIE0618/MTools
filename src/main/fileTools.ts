import { dialog, BrowserWindow, nativeImage } from 'electron'
import { basename, dirname, extname, join } from 'node:path'
import { copyFile, mkdir, readdir, rename, writeFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { spawn } from 'node:child_process'

function parentWin(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

export async function pickFiles(filters?: Electron.FileFilter[]): Promise<string[]> {
  const win = parentWin()
  const opts: Electron.OpenDialogOptions = {
    properties: ['openFile', 'multiSelections'],
    filters
  }
  const r = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts)
  return r.canceled ? [] : r.filePaths
}

export async function pickDirectory(): Promise<string | null> {
  const win = parentWin()
  const opts: Electron.OpenDialogOptions = { properties: ['openDirectory'] }
  const r = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts)
  return r.canceled ? null : (r.filePaths[0] ?? null)
}

export async function pickSavePath(defaultPath: string): Promise<string | null> {
  const win = parentWin()
  const opts: Electron.SaveDialogOptions = { defaultPath }
  const r = win ? await dialog.showSaveDialog(win, opts) : await dialog.showSaveDialog(opts)
  return r.canceled ? null : (r.filePath ?? null)
}

export async function listImageFiles(dir: string): Promise<string[]> {
  const names = await readdir(dir)
  const exts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'])
  return names
    .filter((n) => exts.has(extname(n).toLowerCase()))
    .map((n) => join(dir, n))
}

export type RenameRule = {
  mode: 'prefix' | 'suffix' | 'replace' | 'sequence'
  value: string
  replaceWith?: string
  start?: number
  pad?: number
}

export function previewRename(paths: string[], rule: RenameRule): { from: string; to: string }[] {
  let seq = rule.start ?? 1
  const pad = rule.pad ?? 3
  return paths.map((p) => {
    const dir = dirname(p)
    const base = basename(p)
    const ext = extname(base)
    const name = basename(base, ext)
    let next = name
    if (rule.mode === 'prefix') next = `${rule.value}${name}`
    else if (rule.mode === 'suffix') next = `${name}${rule.value}`
    else if (rule.mode === 'replace') next = name.split(rule.value).join(rule.replaceWith ?? '')
    else {
      next = `${rule.value}${String(seq).padStart(pad, '0')}`
      seq += 1
    }
    return { from: p, to: join(dir, `${next}${ext}`) }
  })
}

export async function applyRename(
  pairs: { from: string; to: string }[]
): Promise<{ ok: boolean; error?: string; count: number }> {
  try {
    for (const { from, to } of pairs) {
      if (from === to) continue
      await rename(from, to)
    }
    return { ok: true, count: pairs.length }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), count: 0 }
  }
}

export type ImageBatchOptions = {
  paths: string[]
  outDir: string
  maxWidth: number
  format: 'png' | 'jpg'
  quality?: number
}

export async function batchResizeImages(
  opts: ImageBatchOptions
): Promise<{ ok: boolean; error?: string; written: string[] }> {
  try {
    await mkdir(opts.outDir, { recursive: true })
    const written: string[] = []
    for (const p of opts.paths) {
      const img = nativeImage.createFromPath(p)
      if (img.isEmpty()) continue
      const { width } = img.getSize()
      const resized =
        width > opts.maxWidth ? img.resize({ width: opts.maxWidth, quality: 'best' }) : img
      const outName = `${basename(p, extname(p))}.${opts.format === 'jpg' ? 'jpg' : 'png'}`
      const outPath = join(opts.outDir, outName)
      const buf =
        opts.format === 'jpg'
          ? resized.toJPEG(Math.min(100, Math.max(1, opts.quality ?? 85)))
          : resized.toPNG()
      await writeFile(outPath, buf)
      written.push(outPath)
    }
    return { ok: true, written }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), written: [] }
  }
}

function runFfmpeg(args: string[]): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const child = spawn('ffmpeg', args, { windowsHide: true })
    let err = ''
    child.stderr.on('data', (d) => {
      err += String(d)
    })
    child.on('error', (e) => resolve({ ok: false, error: e.message }))
    child.on('close', (code) => {
      if (code === 0) resolve({ ok: true })
      else resolve({ ok: false, error: err.slice(-500) || `ffmpeg 退出码 ${code}` })
    })
  })
}

export async function ensureFfmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('ffmpeg', ['-version'], { windowsHide: true })
    child.on('error', () => resolve(false))
    child.on('close', (code) => resolve(code === 0))
  })
}

export async function batchConvertVideos(
  paths: string[],
  outDir: string,
  mode: 'mp4' | 'audio' | 'compress'
): Promise<{ ok: boolean; error?: string; written: string[]; ffmpegOk: boolean }> {
  const ffmpegOk = await ensureFfmpeg()
  if (!ffmpegOk) {
    return {
      ok: false,
      ffmpegOk: false,
      written: [],
      error: '未检测到 ffmpeg，请安装并加入 PATH 后重试'
    }
  }
  await mkdir(outDir, { recursive: true })
  const written: string[] = []
  for (const p of paths) {
    const stem = basename(p, extname(p))
    let out = ''
    let args: string[] = []
    if (mode === 'mp4') {
      out = join(outDir, `${stem}.mp4`)
      args = ['-y', '-i', p, '-c:v', 'libx264', '-c:a', 'aac', out]
    } else if (mode === 'audio') {
      out = join(outDir, `${stem}.mp3`)
      args = ['-y', '-i', p, '-vn', '-acodec', 'libmp3lame', out]
    } else {
      out = join(outDir, `${stem}_compressed.mp4`)
      args = ['-y', '-i', p, '-vf', 'scale=-2:720', '-c:v', 'libx264', '-crf', '28', '-c:a', 'aac', out]
    }
    const r = await runFfmpeg(args)
    if (!r.ok) return { ok: false, ffmpegOk: true, written, error: r.error }
    written.push(out)
  }
  return { ok: true, ffmpegOk: true, written }
}

export async function writeBinaryFile(
  filePath: string,
  data: Uint8Array | Buffer
): Promise<{ ok: boolean; error?: string }> {
  try {
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, Buffer.from(data))
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function copyIntoDir(src: string, destDir: string): Promise<string> {
  await mkdir(destDir, { recursive: true })
  const dest = join(destDir, basename(src))
  await copyFile(src, dest)
  return dest
}
