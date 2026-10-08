import { useCallback, useState } from 'react'
import { Parser } from 'expr-eval'
import { toastBus } from '../../lib/toastBus'

const parser = new Parser({
  operators: {
    add: true,
    concatenate: false,
    conditional: false,
    divide: true,
    factorial: true,
    multiply: true,
    power: true,
    remainder: true,
    subtract: true,
    logical: false,
    comparison: false
  }
})

export default function CalculatorTool(): React.JSX.Element {
  const [expr, setExpr] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const calc = useCallback(() => {
    setError('')
    try {
      const value = parser.evaluate(expr)
      setResult(String(value))
    } catch {
      setResult('')
      setError('表达式无效')
    }
  }, [expr])

  const append = (s: string): void => setExpr((e) => e + s)

  return (
    <div className="tool-panel">
      <label className="tool-field">
        <span className="tool-field__label">表达式</span>
        <input
          className="tool-input tool-input--grow"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') calc()
          }}
          placeholder="例如 (12 + 3) * 2 ^ 2"
        />
      </label>
      <div className="calc-pad">
        {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '(', '+', ')', '^'].map(
          (k) => (
            <button key={k} type="button" className="tool-btn" onClick={() => append(k)}>
              {k}
            </button>
          )
        )}
        <button type="button" className="tool-btn" onClick={() => setExpr('')}>
          C
        </button>
        <button type="button" className="tool-btn tool-btn--primary" onClick={calc}>
          =
        </button>
      </div>
      {error ? <p className="tool-error">{error}</p> : null}
      <label className="tool-field">
        <span className="tool-field__label">结果</span>
        <div className="tool-inline-row">
          <input className="tool-input tool-input--grow" value={result} readOnly />
          <button
            type="button"
            className="tool-btn"
            disabled={!result}
            onClick={() => {
              void navigator.clipboard.writeText(result).then(
                () => toastBus.show('已复制'),
                () => toastBus.show('复制失败')
              )
            }}
          >
            复制
          </button>
        </div>
      </label>
    </div>
  )
}
