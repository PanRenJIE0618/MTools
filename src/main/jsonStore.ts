import { app } from 'electron'
import { dirname, join } from 'node:path'
import { readFile, writeFile, mkdir } from 'node:fs/promises'

export function userDataPath(...parts: string[]): string {
  return join(app.getPath('userData'), ...parts)
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, 'utf8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
}
