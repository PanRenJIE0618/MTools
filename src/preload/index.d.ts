import type { Tool } from '../shared/tool'

export interface MtoolsAPI {
  listExternal(): Promise<Tool[]>
  saveExternal(tools: Tool[]): Promise<void>
  launch(tool: Pick<Tool, 'kind' | 'target' | 'args'>): Promise<{ ok: boolean; error?: string }>
}

declare global {
  interface Window {
    mtools: MtoolsAPI
  }
}
