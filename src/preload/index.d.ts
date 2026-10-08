import type { Tool } from '../shared/tool'

export type ClipboardItem = { id: string; text: string; at: number }
export type ScreenSource = { id: string; name: string; thumbnailDataUrl: string }
export type NetAddress = { name: string; address: string; internal: boolean }

export interface MtoolsAPI {
  listExternal(): Promise<Tool[]>
  saveExternal(tools: Tool[]): Promise<void>
  launch(tool: Pick<Tool, 'kind' | 'target' | 'args'>): Promise<{ ok: boolean; error?: string }>

  clipHistory(): Promise<ClipboardItem[]>
  clipWrite(text: string): Promise<{ ok: boolean }>
  clipWriteImage(dataUrl: string): Promise<{ ok: boolean; error?: string }>
  clipClear(): Promise<{ ok: boolean }>

  pickFiles(filters?: { name: string; extensions: string[] }[]): Promise<string[]>
  pickDir(): Promise<string | null>
  pickSave(defaultPath?: string): Promise<string | null>
  listImages(dir: string): Promise<string[]>
  previewRename(
    paths: string[],
    rule: unknown
  ): Promise<{ from: string; to: string }[]>
  applyRename(pairs: { from: string; to: string }[]): Promise<{
    ok: boolean
    error?: string
    count: number
  }>
  imageBatch(opts: unknown): Promise<{ ok: boolean; error?: string; written: string[] }>
  videoBatch(
    paths: string[],
    outDir: string,
    mode: string
  ): Promise<{ ok: boolean; error?: string; written: string[]; ffmpegOk: boolean }>
  ffmpegOk(): Promise<boolean>
  writeBinary(filePath: string, data: Uint8Array): Promise<{ ok: boolean; error?: string }>

  screenList(): Promise<ScreenSource[]>
  screenCapture(sourceId: string): Promise<{ ok: boolean; error?: string; dataUrl?: string }>

  netAddresses(): Promise<NetAddress[]>
  netDns(host: string): Promise<{ ok: boolean; address?: string; error?: string }>
  netLatency(url: string): Promise<{
    ok: boolean
    ms?: number
    status?: number
    error?: string
  }>
  translate(
    text: string,
    from: string,
    to: string
  ): Promise<{ ok: boolean; text?: string; error?: string }>

  lanStart(): Promise<{
    ok: boolean
    port?: number
    urls?: string[]
    dir?: string
    error?: string
  }>
  lanStop(): Promise<{ ok: boolean }>
  lanStatus(): Promise<{ running: boolean; port: number; urls: string[]; dir: string }>
  lanFiles(): Promise<string[]>

  storeGet(name: string): Promise<unknown>
  storeSet(name: string, data: unknown): Promise<{ ok: boolean; error?: string }>
}

declare global {
  interface Window {
    mtools: MtoolsAPI
  }
}
