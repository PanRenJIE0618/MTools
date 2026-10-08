import { useCallback, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

function clampCount(n: number): number {
  return Math.min(20, Math.max(1, Math.floor(n)))
}

export default function UuidTool(): React.JSX.Element {
  const [count, setCount] = useState(1)
  const [output, setOutput] = useState('')

  const runGenerate = useCallback(() => {
    const n = clampCount(count)
    const lines: string[] = []
    for (let i = 0; i < n; i++) {
      lines.push(crypto.randomUUID())
    }
    setOutput(lines.join('\n'))
  }, [count])

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
        <span className="tool-field__label">数量（1–20）</span>
        <input
          className="tool-input"
          type="number"
          min={1}
          max={20}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />
      </label>
      <div className="tool-actions">
        <button type="button" className="tool-btn tool-btn--primary" onClick={runGenerate}>
          生成
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
          rows={10}
        />
      </label>
    </div>
  )
}
