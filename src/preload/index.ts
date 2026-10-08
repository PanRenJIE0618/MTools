import { contextBridge, ipcRenderer } from 'electron'

const mtools = {
  listExternal: () => ipcRenderer.invoke('tools:list'),
  saveExternal: (tools: unknown) => ipcRenderer.invoke('tools:save', tools),
  launch: (tool: unknown) => ipcRenderer.invoke('tools:launch', tool)
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
