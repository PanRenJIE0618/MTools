import { contextBridge, ipcRenderer } from 'electron'

const mtools = {
  listExternal: () => ipcRenderer.invoke('tools:list'),
  saveExternal: (tools: unknown) => ipcRenderer.invoke('tools:save', tools),
  launch: (tool: unknown) => ipcRenderer.invoke('tools:launch', tool),

  clipHistory: () => ipcRenderer.invoke('clip:history'),
  clipWrite: (text: string) => ipcRenderer.invoke('clip:write', text),
  clipWriteImage: (dataUrl: string) => ipcRenderer.invoke('clip:writeImage', dataUrl),
  clipClear: () => ipcRenderer.invoke('clip:clear'),

  pickFiles: (filters?: unknown) => ipcRenderer.invoke('files:pick', filters),
  pickDir: () => ipcRenderer.invoke('files:pickDir'),
  pickSave: (defaultPath?: string) => ipcRenderer.invoke('files:pickSave', defaultPath),
  listImages: (dir: string) => ipcRenderer.invoke('files:listImages', dir),
  previewRename: (paths: string[], rule: unknown) =>
    ipcRenderer.invoke('files:previewRename', paths, rule),
  applyRename: (pairs: unknown) => ipcRenderer.invoke('files:applyRename', pairs),
  imageBatch: (opts: unknown) => ipcRenderer.invoke('files:imageBatch', opts),
  videoBatch: (paths: string[], outDir: string, mode: string) =>
    ipcRenderer.invoke('files:videoBatch', paths, outDir, mode),
  ffmpegOk: () => ipcRenderer.invoke('files:ffmpegOk'),
  writeBinary: (filePath: string, data: Uint8Array) =>
    ipcRenderer.invoke('files:writeBinary', filePath, data),

  screenList: () => ipcRenderer.invoke('screen:list'),
  screenCapture: (sourceId: string) => ipcRenderer.invoke('screen:capture', sourceId),

  netAddresses: () => ipcRenderer.invoke('net:addresses'),
  netDns: (host: string) => ipcRenderer.invoke('net:dns', host),
  netLatency: (url: string) => ipcRenderer.invoke('net:latency', url),
  translate: (text: string, from: string, to: string) =>
    ipcRenderer.invoke('net:translate', text, from, to),

  lanStart: () => ipcRenderer.invoke('lan:start'),
  lanStop: () => ipcRenderer.invoke('lan:stop'),
  lanStatus: () => ipcRenderer.invoke('lan:status'),
  lanFiles: () => ipcRenderer.invoke('lan:files'),

  storeGet: (name: string) => ipcRenderer.invoke('store:get', name),
  storeSet: (name: string, data: unknown) => ipcRenderer.invoke('store:set', name, data)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('mtools', mtools)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error exposed for non-isolated preload
  window.mtools = mtools
}
