import { useCallback, useMemo, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGIT = '0123456789'
const SYMBOL = '!@#$%^&*()-_=+[]{};:,.?/'

function generatePassword(
  length: number,
  opts: { lower: boolean; upper: boolean; digit: boolean; symbol: boolean }
): string {
  let pool = ''
  if (opts.lower) pool += LOWER
  if (opts.upper) pool += UPPER
  if (opts.digit) pool += DIGIT
  if (opts.symbol) pool += SYMBOL
  if (!pool) return ''
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => pool[b % pool.length]).join('')
}

export default function PasswordTool(): React.JSX.Element {
  const [length, setLength] = useState(16)
  const [lower, setLower] = useState(true)
  const [upper, setUpper] = useState(true)
  const [digit, setDigit] = useState(true)
  const [symbol, setSymbol] = useState(false)
  const [output, setOutput] = useState('')

  const canGenerate = useMemo(
    () => lower || upper || digit || symbol,
    [lower, upper, digit, symbol]
  )

  const handleGenerate = useCallback(() => {
    const n = Math.min(128, Math.max(4, Math.floor(length) || 16))
    setLength(n)
    setOutput(generatePassword(n, { lower, upper, digit, symbol }))
  }, [length, lower, upper, digit, symbol])

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
        <span className="tool-field__label">长度（4–128）</span>
        <input
          className="tool-input"
          type="number"
          min={4}
          max={128}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
        />
      </label>
      <fieldset className="regex-flags">
        <legend className="tool-field__label">字符集</legend>
        <label className="regex-flag">
          <input type="checkbox" checked={lower} onChange={(e) => setLower(e.target.checked)} />
          小写字母
        </label>
        <label className="regex-flag">
          <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} />
          大写字母
        </label>
        <label className="regex-flag">
          <input type="checkbox" checked={digit} onChange={(e) => setDigit(e.target.checked)} />
          数字
        </label>
        <label className="regex-flag">
          <input type="checkbox" checked={symbol} onChange={(e) => setSymbol(e.target.checked)} />
          符号
        </label>
      </fieldset>
      <div className="tool-actions">
        <button
          type="button"
          className="tool-btn tool-btn--primary"
          onClick={handleGenerate}
          disabled={!canGenerate}
        >
          生成
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={() => void handleCopy()}
          disabled={!output}
        >
          复制
        </button>
      </div>
      <label className="tool-field">
        <span className="tool-field__label">结果</span>
        <textarea
          className="tool-textarea tool-textarea--readonly"
          value={output}
          readOnly
          rows={3}
          placeholder="点击生成"
        />
      </label>
    </div>
  )
}
