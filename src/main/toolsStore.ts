import { app } from 'electron'
import { join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import type { Tool } from '../shared/tool'

function toolsFilePath(): string {
  return join(app.getPath('userData'), 'tools.json')
}

export async function loadExternalTools(): Promise<Tool[]> {
  try {
    const raw = await readFile(toolsFilePath(), 'utf-8')
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Tool[]
  } catch {
    return []
  }
}

export async function saveExternalTools(tools: Tool[]): Promise<void> {
  await writeFile(toolsFilePath(), JSON.stringify(tools, null, 2), 'utf-8')
}
