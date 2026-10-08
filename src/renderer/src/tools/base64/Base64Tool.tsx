import { useCallback, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

function encodeBase64(text: string): string {
  return btoa(unescape(encodeURIComponent(text)))
}

function decodeBase64(text: string): string {
  return decodeURIComponent(escape(atob(text)))
}

export default function Base64Tool(): React.JSX.Element {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const runEncode = useCallback(() => {
    setError('')
    if (!input) {
      setOutput('')
      return
    }
    try {
      setOutput(encodeBase64(input))
    } catch (e) {
      setOutput('')
      setError(e instanceof Error ? e.message : '编码失败')
    }
  }, [input])

  const runDecode = useCallback(() => {
    setError('')
    const trimmed = input.trim()
    if (!trimmed) {
      setOutput('')
      return
    }
    try {
      setOutput(decodeBase64(trimmed))
    } catch {
      setOutput('')
      setError('无效的 Base64 字符串')
    }
  }, [input])

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
          placeholder="文本或 Base64…"
          rows={10}
        />
      </label>
      <div className="tool-actions">
        <button type="button" className="tool-btn tool-btn--primary" onClick={runEncode}>
          编码
        </button>
        <button type="button" className="tool-btn" onClick={runDecode}>
          解码
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={() => void handleCopy()}
          disabled={!output}
        >
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
          placeholder="结果将显示在这里"
          rows={10}
        />
      </label>
    </div>
  )
}
