import { shell } from 'electron'
import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import type { ToolKind } from '../shared/tool'

export { assertSafeUrl } from './assertSafeUrl'
import { assertSafeUrl } from './assertSafeUrl'

export async function launchExternal(tool: {
  kind: Extract<ToolKind, 'app' | 'script' | 'url'>
  target?: string
  args?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!tool.target) return { ok: false, error: '缺少目标路径或 URL' }
    if (tool.kind === 'url') {
      await shell.openExternal(assertSafeUrl(tool.target))
      return { ok: true }
    }
    await access(tool.target, constants.F_OK)
    if (tool.kind === 'app' && tool.args?.trim()) {
      const argv = tool.args.trim().split(/\s+/)
      spawn(tool.target, argv, { detached: true, stdio: 'ignore' }).unref()
      return { ok: true }
    }
    const err = await shell.openPath(tool.target)
    if (err) return { ok: false, error: err }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
