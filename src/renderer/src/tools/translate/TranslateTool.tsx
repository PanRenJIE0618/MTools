import { useCallback, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

export default function TranslateTool(): React.JSX.Element {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [from, setFrom] = useState('zh')
  const [to, setTo] = useState('en')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const run = useCallback(async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    const r = await window.mtools.translate(input.trim(), from, to)
    setLoading(false)
    if (!r.ok || !r.text) {
      setError(r.error || '翻译失败（需联网）')
      setOutput('')
      return
    }
    setOutput(r.text)
  }, [from, input, to])

  return (
    <div className="tool-panel">
      <p className="tool-field__label" style={{ margin: 0 }}>
        使用 MyMemory 公共接口，需联网；不适合敏感内容
      </p>
      <div className="tool-inline-row">
        <select className="tool-input" value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="zh">中文</option>
          <option value="en">英语</option>
          <option value="ja">日语</option>
          <option value="ko">韩语</option>
        </select>
        <button
          type="button"
          className="tool-btn"
          onClick={() => {
            setFrom(to)
            setTo(from)
          }}
        >
          ⇄
        </button>
        <select className="tool-input" value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="en">英语</option>
          <option value="zh">中文</option>
          <option value="ja">日语</option>
          <option value="ko">韩语</option>
        </select>
      </div>
      <label className="tool-field">
        <span className="tool-field__label">原文</span>
        <textarea
          className="tool-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
        />
      </label>
      <div className="tool-actions">
        <button
          type="button"
          className="tool-btn tool-btn--primary"
          onClick={() => void run()}
          disabled={loading}
        >
          {loading ? '翻译中…' : '翻译'}
        </button>
        <button
          type="button"
          className="tool-btn"
          disabled={!output}
          onClick={() => {
            void navigator.clipboard.writeText(output).then(
              () => toastBus.show('已复制'),
              () => toastBus.show('复制失败')
            )
          }}
        >
          复制译文
        </button>
      </div>
      {error ? <p className="tool-error">{error}</p> : null}
      <label className="tool-field">
        <span className="tool-field__label">译文</span>
        <textarea className="tool-textarea tool-textarea--readonly" value={output} readOnly rows={6} />
      </label>
    </div>
  )
}
