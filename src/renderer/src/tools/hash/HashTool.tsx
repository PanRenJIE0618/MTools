import { useCallback, useState } from 'react'
import { toastBus } from '../../lib/toastBus'
import { hashText, type HashAlgo } from './hashText'

const ALGOS: HashAlgo[] = ['MD5', 'SHA1', 'SHA256']

export default function HashTool(): React.JSX.Element {
  const [input, setInput] = useState('')
  const [algo, setAlgo] = useState<HashAlgo>('MD5')
  const [output, setOutput] = useState('')

  const runHash = useCallback(() => {
    setOutput(hashText(algo, input))
  }, [algo, input])

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
        <span className="tool-field__label">算法</span>
        <select
          className="tool-select"
          value={algo}
          onChange={(e) => setAlgo(e.target.value as HashAlgo)}
        >
          {ALGOS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      <label className="tool-field">
        <span className="tool-field__label">输入</span>
        <textarea
          className="tool-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="待计算哈希的文本…"
          rows={10}
        />
      </label>
      <div className="tool-actions">
        <button type="button" className="tool-btn tool-btn--primary" onClick={runHash}>
          计算
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
