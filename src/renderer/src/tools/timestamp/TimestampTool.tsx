import { useCallback, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

function timestampToLocal(text: string): { ok: true; value: string } | { ok: false; message: string } {
  const trimmed = text.trim()
  if (!trimmed) {
    return { ok: false, message: '请输入时间戳' }
  }
  const num = Number(trimmed)
  if (!Number.isFinite(num)) {
    return { ok: false, message: '无效的时间戳' }
  }
  const ms = num < 1e12 ? num * 1000 : num
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) {
    return { ok: false, message: '无效的时间戳' }
  }
  return { ok: true, value: date.toLocaleString() }
}

function localToTimestamp(text: string): { ok: true; value: string } | { ok: false; message: string } {
  const trimmed = text.trim()
  if (!trimmed) {
    return { ok: false, message: '请输入日期时间' }
  }
  const ms = Date.parse(trimmed)
  if (Number.isNaN(ms)) {
    return { ok: false, message: '无法解析日期时间' }
  }
  return { ok: true, value: String(ms) }
}

export default function TimestampTool(): React.JSX.Element {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const runToDate = useCallback(() => {
    setError('')
    const result = timestampToLocal(input)
    if (!result.ok) {
      setOutput('')
      setError(result.message)
      return
    }
    setOutput(result.value)
  }, [input])

  const runToTimestamp = useCallback(() => {
    setError('')
    const result = localToTimestamp(input)
    if (!result.ok) {
      setOutput('')
      setError(result.message)
      return
    }
    setOutput(result.value)
  }, [input])

  const fillNow = useCallback(() => {
    setError('')
    setInput(String(Date.now()))
    setOutput('')
  }, [])

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
          placeholder="时间戳（秒/毫秒）或本地日期时间…"
          rows={6}
        />
      </label>
      <div className="tool-actions">
        <button type="button" className="tool-btn tool-btn--primary" onClick={runToDate}>
          转日期
        </button>
        <button type="button" className="tool-btn" onClick={runToTimestamp}>
          转时间戳
        </button>
        <button type="button" className="tool-btn" onClick={fillNow}>
          现在
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
          rows={4}
        />
      </label>
    </div>
  )
}
