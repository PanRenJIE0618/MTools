import { useCallback, useMemo, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

function splitWords(input: string): string[] {
  const s = input.trim()
  if (!s) return []
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-.\s]+/g, ' ')
    .split(' ')
    .map((w) => w.trim())
    .filter(Boolean)
}

function toCases(input: string): Record<string, string> {
  const words = splitWords(input)
  if (!words.length) {
    return {
      camel: '',
      pascal: '',
      snake: '',
      kebab: '',
      constant: '',
      title: ''
    }
  }
  const lower = words.map((w) => w.toLowerCase())
  const camel = lower[0] + lower.slice(1).map((w) => w[0].toUpperCase() + w.slice(1)).join('')
  const pascal = lower.map((w) => w[0].toUpperCase() + w.slice(1)).join('')
  const snake = lower.join('_')
  const kebab = lower.join('-')
  const constant = lower.join('_').toUpperCase()
  const title = lower.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
  return { camel, pascal, snake, kebab, constant, title }
}

const LABELS: { key: keyof ReturnType<typeof toCases>; label: string }[] = [
  { key: 'camel', label: 'camelCase' },
  { key: 'pascal', label: 'PascalCase' },
  { key: 'snake', label: 'snake_case' },
  { key: 'kebab', label: 'kebab-case' },
  { key: 'constant', label: 'CONSTANT_CASE' },
  { key: 'title', label: 'Title Case' }
]

export default function CaseTool(): React.JSX.Element {
  const [input, setInput] = useState('')
  const results = useMemo(() => toCases(input), [input])

  const copy = useCallback(async (text: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toastBus.show('已复制')
    } catch {
      toastBus.show('复制失败')
    }
  }, [])

  return (
    <div className="tool-panel">
      <label className="tool-field">
        <span className="tool-field__label">输入</span>
        <input
          className="tool-input tool-input--grow"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="user_name / userName / User Name"
        />
      </label>
      {LABELS.map(({ key, label }) => (
        <label key={key} className="tool-field">
          <span className="tool-field__label">{label}</span>
          <div className="tool-inline-row">
            <input className="tool-input tool-input--grow" value={results[key]} readOnly />
            <button
              type="button"
              className="tool-btn"
              onClick={() => void copy(results[key])}
              disabled={!results[key]}
            >
              复制
            </button>
          </div>
        </label>
      ))}
    </div>
  )
}
