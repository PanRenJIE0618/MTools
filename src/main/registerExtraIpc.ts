import { ipcMain } from 'electron'
import {
  clearClipboardHistory,
  getClipboardHistory,
  pollClipboard,
  writeClipboard,
  writeClipboardImage
} from './clipboardService'
import {
  applyRename,
  batchConvertVideos,
  batchResizeImages,
  ensureFfmpeg,
  listImageFiles,
  pickDirectory,
  pickFiles,
  pickSavePath,
  previewRename,
  writeBinaryFile,
  type RenameRule
} from './fileTools'
import { readJsonFile, userDataPath, writeJsonFile } from './jsonStore'
import { lanStatus, listLanFiles, startLanServer, stopLanServer } from './lanServer'
import { httpLatency, listLocalAddresses, resolveHost, translateText } from './networkService'
import { captureScreenDataUrl, listScreenSources } from './screenshotService'

export function registerExtraIpc(): void {
  setInterval(() => {
    pollClipboard()
  }, 1000)

  ipcMain.handle('clip:history', () => {
    pollClipboard()
    return getClipboardHistory()
  })
  ipcMain.handle('clip:write', (_e, text: unknown) => {
    if (typeof text !== 'string') return { ok: false }
    writeClipboard(text)
    return { ok: true }
  })
  ipcMain.handle('clip:writeImage', (_e, dataUrl: unknown) => {
    if (typeof dataUrl !== 'string') return { ok: false, error: '无效参数' }
    return writeClipboardImage(dataUrl)
  })
  ipcMain.handle('clip:clear', () => {
    clearClipboardHistory()
    return { ok: true }
  })

  ipcMain.handle('files:pick', (_e, filters?: unknown) =>
    pickFiles(Array.isArray(filters) ? (filters as Electron.FileFilter[]) : undefined)
  )
  ipcMain.handle('files:pickDir', () => pickDirectory())
  ipcMain.handle('files:pickSave', (_e, defaultPath: unknown) =>
    pickSavePath(typeof defaultPath === 'string' ? defaultPath : 'file.bin')
  )
  ipcMain.handle('files:listImages', async (_e, dir: unknown) => {
    if (typeof dir !== 'string') return []
    return listImageFiles(dir)
  })
  ipcMain.handle('files:previewRename', (_e, paths: unknown, rule: unknown) => {
    if (!Array.isArray(paths) || typeof rule !== 'object' || !rule) return []
    return previewRename(paths as string[], rule as RenameRule)
  })
  ipcMain.handle('files:applyRename', (_e, pairs: unknown) => {
    if (!Array.isArray(pairs)) return { ok: false, error: '无效参数', count: 0 }
    return applyRename(pairs as { from: string; to: string }[])
  })
  ipcMain.handle('files:imageBatch', (_e, opts: unknown) => {
    if (!opts || typeof opts !== 'object') return { ok: false, error: '无效参数', written: [] }
    return batchResizeImages(opts as Parameters<typeof batchResizeImages>[0])
  })
  ipcMain.handle('files:videoBatch', (_e, paths: unknown, outDir: unknown, mode: unknown) => {
    if (!Array.isArray(paths) || typeof outDir !== 'string') {
      return { ok: false, error: '无效参数', written: [], ffmpegOk: false }
    }
    const m = mode === 'audio' || mode === 'compress' ? mode : 'mp4'
    return batchConvertVideos(paths as string[], outDir, m)
  })
  ipcMain.handle('files:ffmpegOk', () => ensureFfmpeg())
  ipcMain.handle('files:writeBinary', (_e, filePath: unknown, data: unknown) => {
    if (typeof filePath !== 'string' || !data) return { ok: false, error: '无效参数' }
    const buf = data instanceof Uint8Array ? data : Buffer.from(data as ArrayBuffer)
    return writeBinaryFile(filePath, buf)
  })

  ipcMain.handle('screen:list', () => listScreenSources())
  ipcMain.handle('screen:capture', (_e, sourceId: unknown) => {
    const id = typeof sourceId === 'string' ? sourceId : ''
    return captureScreenDataUrl(id)
  })

  ipcMain.handle('net:addresses', () => listLocalAddresses())
  ipcMain.handle('net:dns', (_e, host: unknown) =>
    resolveHost(typeof host === 'string' ? host : '')
  )
  ipcMain.handle('net:latency', (_e, url: unknown) =>
    httpLatency(typeof url === 'string' ? url : '')
  )
  ipcMain.handle('net:translate', (_e, text: unknown, from: unknown, to: unknown) =>
    translateText(
      typeof text === 'string' ? text : '',
      typeof from === 'string' ? from : 'zh',
      typeof to === 'string' ? to : 'en'
    )
  )

  ipcMain.handle('lan:start', () => startLanServer())
  ipcMain.handle('lan:stop', () => stopLanServer())
  ipcMain.handle('lan:status', () => lanStatus())
  ipcMain.handle('lan:files', () => listLanFiles())

  ipcMain.handle('store:get', async (_e, name: unknown) => {
    if (typeof name !== 'string' || !/^[\w-]+$/.test(name)) return null
    return readJsonFile(userDataPath('stores', `${name}.json`), null)
  })
  ipcMain.handle('store:set', async (_e, name: unknown, data: unknown) => {
    if (typeof name !== 'string' || !/^[\w-]+$/.test(name)) {
      return { ok: false, error: '无效名称' }
    }
    await writeJsonFile(userDataPath('stores', `${name}.json`), data)
    return { ok: true }
  })
}
