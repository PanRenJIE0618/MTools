import { useCallback, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

type BaseKey = 'bin' | 'oct' | 'dec' | 'hex'

function parseByBase(raw: string, base: BaseKey): bigint | null {
  const s = raw.trim().replace(/\s+/g, '')
  if (!s) return null
  try {
    if (base === 'bin') {
      if (!/^[01]+$/i.test(s)) return null
      return BigInt(`0b${s}`)
    }
    if (base === 'oct') {
      if (!/^[0-7]+$/i.test(s)) return null
      return BigInt(`0o${s}`)
    }
    if (base === 'hex') {
      const h = s.replace(/^0x/i, '')
      if (!/^[0-9a-f]+$/i.test(h)) return null
      return BigInt(`0x${h}`)
    }
    if (!/^-?\d+$/.test(s)) return null
    return BigInt(s)
  } catch {
    return null
  }
}

function formatValue(n: bigint): Record<BaseKey, string> {
  const abs = n < 0n ? -n : n
  const sign = n < 0n ? '-' : ''
  return {
    bin: sign + abs.toString(2),
    oct: sign + abs.toString(8),
    dec: n.toString(10),
    hex: sign + abs.toString(16).toUpperCase()
  }
}

export default function RadixTool(): React.JSX.Element {
  const [active, setActive] = useState<BaseKey>('dec')
  const [values, setValues] = useState<Record<BaseKey, string>>({
    bin: '',
    oct: '',
    dec: '',
    hex: ''
  })
  const [error, setError] = useState('')

  const onChange = useCallback((base: BaseKey, text: string) => {
    setActive(base)
    setValues((prev) => ({ ...prev, [base]: text }))
    if (!text.trim()) {
      setValues({ bin: '', oct: '', dec: '', hex: '' })
      setError('')
      return
    }
    const n = parseByBase(text, base)
    if (n === null) {
      setError('输入无效')
      return
    }
    setError('')
    setValues(formatValue(n))
  }, [])

  const handleCopy = useCallback(async (key: BaseKey) => {
    const v = values[key]
    if (!v) return
    try {
      await navigator.clipboard.writeText(v)
      toastBus.show('已复制')
    } catch {
      toastBus.show('复制失败')
    }
  }, [values])

  const fields: { key: BaseKey; label: string }[] = [
    { key: 'bin', label: '二进制 (2)' },
    { key: 'oct', label: '八进制 (8)' },
    { key: 'dec', label: '十进制 (10)' },
    { key: 'hex', label: '十六进制 (16)' }
  ]

  return (
    <div className="tool-panel">
      <p className="tool-field__label" style={{ margin: 0 }}>
        在任意进制输入，其余自动换算
      </p>
      {fields.map(({ key, label }) => (
        <label key={key} className="tool-field">
          <span className="tool-field__label">
            {label}
            {active === key ? ' · 当前' : ''}
          </span>
          <div className="tool-inline-row">
            <input
              className="tool-input tool-input--grow"
              value={values[key]}
              onChange={(e) => onChange(key, e.target.value)}
              spellCheck={false}
            />
            <button
              type="button"
              className="tool-btn"
              onClick={() => void handleCopy(key)}
              disabled={!values[key]}
            >
              复制
            </button>
          </div>
        </label>
      ))}
      {error ? <p className="tool-error">{error}</p> : null}
    </div>
  )
}
