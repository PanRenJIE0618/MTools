import { useCallback, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

export default function JsonTool(): React.JSX.Element {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const runFormat = useCallback((pretty: boolean) => {
    setError('')
    const trimmed = input.trim()
    if (!trimmed) {
      setOutput('')
      return
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown
      setOutput(JSON.stringify(parsed, null, pretty ? 2 : undefined))
    } catch {
      setOutput('')
      setError('JSON 解析失败')
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
          placeholder="粘贴 JSON…"
          rows={10}
        />
      </label>
      <div className="tool-actions">
        <button type="button" className="tool-btn tool-btn--primary" onClick={() => runFormat(true)}>
          格式化
        </button>
        <button type="button" className="tool-btn" onClick={() => runFormat(false)}>
          压缩
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
