import { useCallback, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

function b64UrlToJson(part: string): unknown {
  const padded = part.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((part.length + 3) % 4)
  const json = decodeURIComponent(
    Array.from(atob(padded), (c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
  )
  return JSON.parse(json) as unknown
}

export default function JwtTool(): React.JSX.Element {
  const [input, setInput] = useState('')
  const [header, setHeader] = useState('')
  const [payload, setPayload] = useState('')
  const [error, setError] = useState('')

  const decode = useCallback(() => {
    setError('')
    const token = input.trim()
    if (!token) {
      setHeader('')
      setPayload('')
      return
    }
    const parts = token.split('.')
    if (parts.length < 2) {
      setHeader('')
      setPayload('')
      setError('不是有效的 JWT（至少包含 header.payload）')
      return
    }
    try {
      setHeader(JSON.stringify(b64UrlToJson(parts[0]), null, 2))
      setPayload(JSON.stringify(b64UrlToJson(parts[1]), null, 2))
    } catch {
      setHeader('')
      setPayload('')
      setError('JWT 解析失败')
    }
  }, [input])

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
      <p className="tool-field__label" style={{ margin: 0 }}>
        仅本地解码 Header / Payload，不校验签名
      </p>
      <label className="tool-field">
        <span className="tool-field__label">JWT</span>
        <textarea
          className="tool-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…"
          rows={5}
        />
      </label>
      <div className="tool-actions">
        <button type="button" className="tool-btn tool-btn--primary" onClick={decode}>
          解析
        </button>
      </div>
      {error ? <p className="tool-error">{error}</p> : null}
      <label className="tool-field">
        <span className="tool-field__label">Header</span>
        <textarea className="tool-textarea tool-textarea--readonly" value={header} readOnly rows={6} />
      </label>
      <div className="tool-actions">
        <button type="button" className="tool-btn" onClick={() => void copy(header)} disabled={!header}>
          复制 Header
        </button>
      </div>
      <label className="tool-field">
        <span className="tool-field__label">Payload</span>
        <textarea className="tool-textarea tool-textarea--readonly" value={payload} readOnly rows={8} />
      </label>
      <div className="tool-actions">
        <button
          type="button"
          className="tool-btn"
          onClick={() => void copy(payload)}
          disabled={!payload}
        >
          复制 Payload
        </button>
      </div>
    </div>
  )
}
