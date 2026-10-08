import { clipboard } from 'electron'

export type ClipboardItem = {
  id: string
  text: string
  at: number
}

const MAX = 80
let history: ClipboardItem[] = []
let lastText = ''

export function pollClipboard(): ClipboardItem[] {
  const text = clipboard.readText()
  if (text && text !== lastText) {
    lastText = text
    history = [
      { id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, at: Date.now() },
      ...history.filter((h) => h.text !== text)
    ].slice(0, MAX)
  }
  return history
}

export function getClipboardHistory(): ClipboardItem[] {
  return history
}

export function writeClipboard(text: string): void {
  clipboard.writeText(text)
  lastText = text
}

export function clearClipboardHistory(): void {
  history = []
}
