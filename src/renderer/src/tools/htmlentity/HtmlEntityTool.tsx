import { useCallback, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

function encodeEntities(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function decodeEntities(text: string): string {
  const doc = new DOMParser().parseFromString(`<!doctype html><body>${text}`, 'text/html')
  return doc.body.textContent ?? ''
}

export default function HtmlEntityTool(): React.JSX.Element {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const run = useCallback(
    (mode: 'encode' | 'decode') => {
      setError('')
      try {
        setOutput(mode === 'encode' ? encodeEntities(input) : decodeEntities(input))
      } catch {
        setOutput('')
        setError('处理失败')
      }
    },
    [input]
  )

  const handleCopy = useCallback(async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      toastBus.show('已复制')
    } catch {
      toastBus.show('复制失败')
    }
  }, [output])

  return (
    <div className="tool-panel">
      <label className="tool-field">
        <span className="tool-field__label">输入</span>
        <textarea
          className="tool-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          placeholder="<div>Hello &amp; world</div>"
        />
      </label>
      <div className="tool-actions">
        <button type="button" className="tool-btn tool-btn--primary" onClick={() => run('encode')}>
          编码
        </button>
        <button type="button" className="tool-btn" onClick={() => run('decode')}>
          解码
        </button>
        <button type="button" className="tool-btn" onClick={() => void handleCopy()} disabled={!output}>
          复制结果
        </button>
      </div>
      {error ? <p className="tool-error">{error}</p> : null}
      <label className="tool-field">
        <span className="tool-field__label">输出</span>
        <textarea
          className="tool-textarea tool-textarea--readonly"
          value={output}
          readOnly
          rows={8}
        />
      </label>
    </div>
  )
}
