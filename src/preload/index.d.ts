import type { Tool } from '../shared/tool'
import { ElectronAPI } from '@electron-toolkit/preload'

export interface MtoolsAPI {
  listExternal(): Promise<Tool[]>
  saveExternal(tools: Tool[]): Promise<void>
  launch(tool: Pick<Tool, 'kind' | 'target' | 'args'>): Promise<{ ok: boolean; error?: string }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    mtools: MtoolsAPI
  }
}
