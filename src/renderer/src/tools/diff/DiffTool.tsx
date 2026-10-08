import { useMemo, useState } from 'react'
import { diffLines } from './diffLines'

export default function DiffTool(): React.JSX.Element {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')

  const result = useMemo(() => diffLines(left, right), [left, right])

  return (
    <div className="tool-panel">
      <div className="diff-inputs">
        <label className="tool-field">
          <span className="tool-field__label">原文</span>
          <textarea
            className="tool-textarea"
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            placeholder="粘贴原始文本…"
            rows={8}
          />
        </label>
        <label className="tool-field">
          <span className="tool-field__label">新文本</span>
          <textarea
            className="tool-textarea"
            value={right}
            onChange={(e) => setRight(e.target.value)}
            placeholder="粘贴修改后的文本…"
            rows={8}
          />
        </label>
      </div>
      <label className="tool-field">
        <span className="tool-field__label">差异</span>
        <div className="diff-result" role="list">
          {result.length === 0 ? (
            <p className="diff-result__empty">输入两段文本以查看差异</p>
          ) : (
            result.map((line, idx) => (
              <div
                key={idx}
                className={`diff-line diff-line--${line.type}`}
                role="listitem"
              >
                <span className="diff-line__prefix">
                  {line.type === 'add' ? '+' : line.type === 'del' ? '−' : ' '}
                </span>
                <span className="diff-line__text">{line.text || '\u00a0'}</span>
              </div>
            ))
          )}
        </div>
      </label>
    </div>
  )
}
