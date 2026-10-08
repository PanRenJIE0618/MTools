import { app } from 'electron'
import { join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import type { Tool, ToolCategory } from '../shared/tool'

function toolsFilePath(): string {
  return join(app.getPath('userData'), 'tools.json')
}

const EXTERNAL_KINDS = new Set(['app', 'script', 'url'] as const)

function parseCategory(value: unknown): ToolCategory {
  if (value === 'dev' || value === 'encode' || value === 'text' || value === 'external') {
    return value
  }
  return 'external'
}

/** Returns a normalized external tool or null if the record is invalid. */
export function sanitizeExternalTool(record: unknown): Tool | null {
  if (!record || typeof record !== 'object') return null
  const t = record as Record<string, unknown>
  if (typeof t.id !== 'string' || !t.id.trim()) return null
  if (typeof t.name !== 'string' || !t.name.trim()) return null
  if (typeof t.kind !== 'string' || !EXTERNAL_KINDS.has(t.kind as 'app' | 'script' | 'url')) {
    return null
  }
  if (t.builtin !== false) return null
  if (typeof t.target !== 'string' || !t.target.trim()) return null

  return {
    id: t.id.trim(),
    name: t.name.trim(),
    description: typeof t.description === 'string' ? t.description : '',
    category: parseCategory(t.category),
    kind: t.kind as 'app' | 'script' | 'url',
    target: t.target.trim(),
    args: typeof t.args === 'string' ? t.args : undefined,
    icon: typeof t.icon === 'string' ? t.icon : undefined,
    builtin: false
  }
}

export function assertValidExternalToolsPayload(tools: unknown): Tool[] {
  if (!Array.isArray(tools)) {
    throw new Error('tools 必须是数组')
  }
  const result: Tool[] = []
  for (const item of tools) {
    const sanitized = sanitizeExternalTool(item)
    if (!sanitized) {
      throw new Error('无效的工具条目')
    }
    result.push(sanitized)
  }
  return result
}

export async function loadExternalTools(): Promise<Tool[]> {
  try {
    const raw = await readFile(toolsFilePath(), 'utf-8')
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const valid: Tool[] = []
    for (const item of parsed) {
      const tool = sanitizeExternalTool(item)
      if (tool) valid.push(tool)
    }
    return valid
  } catch {
    return []
  }
}

export async function saveExternalTools(tools: Tool[]): Promise<void> {
  await writeFile(toolsFilePath(), JSON.stringify(tools, null, 2), 'utf-8')
}
