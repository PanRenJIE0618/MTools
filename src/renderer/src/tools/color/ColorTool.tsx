import { useCallback, useState } from 'react'
import { toastBus } from '../../lib/toastBus'
import {
  formatHsl,
  formatRgb,
  hslToRgb,
  parseHex,
  rgbToHex,
  rgbToHsl,
  type Hsl,
  type Rgb
} from './colorMath'

type Form = {
  hex: string
  r: string
  g: string
  b: string
  h: string
  s: string
  l: string
}

function fromRgb(rgb: Rgb): Form {
  const hsl = rgbToHsl(rgb)
  return {
    hex: rgbToHex(rgb),
    r: String(Math.round(rgb.r)),
    g: String(Math.round(rgb.g)),
    b: String(Math.round(rgb.b)),
    h: String(Math.round(hsl.h)),
    s: String(Math.round(hsl.s)),
    l: String(Math.round(hsl.l))
  }
}

const initial = fromRgb({ r: 47, g: 111, b: 237 })

export default function ColorTool(): React.JSX.Element {
  const [form, setForm] = useState<Form>(initial)
  const [error, setError] = useState('')

  const onHex = useCallback((hex: string) => {
    const rgb = parseHex(hex)
    if (!rgb) {
      setForm((f) => ({ ...f, hex }))
      setError('HEX 无效')
      return
    }
    setError('')
    setForm(fromRgb(rgb))
  }, [])

  const onRgb = useCallback((part: keyof Rgb, value: string) => {
    setForm((f) => {
      const next = { ...f, [part]: value }
      const r = Number(next.r)
      const g = Number(next.g)
      const b = Number(next.b)
      if (![r, g, b].every((n) => Number.isFinite(n) && n >= 0 && n <= 255)) {
        setError('RGB 需为 0–255')
        return next
      }
      setError('')
      return fromRgb({ r, g, b })
    })
  }, [])

  const onHsl = useCallback((part: keyof Hsl, value: string) => {
    setForm((f) => {
      const next = { ...f, [part]: value }
      const h = Number(next.h)
      const s = Number(next.s)
      const l = Number(next.l)
      if (![h, s, l].every((n) => Number.isFinite(n))) {
        setError('HSL 数值无效')
        return next
      }
      setError('')
      return fromRgb(hslToRgb({ h, s, l }))
    })
  }, [])

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toastBus.show('已复制')
    } catch {
      toastBus.show('复制失败')
    }
  }, [])

  const rgb: Rgb = {
    r: Number(form.r) || 0,
    g: Number(form.g) || 0,
    b: Number(form.b) || 0
  }
  const hsl = rgbToHsl(rgb)

  return (
    <div className="tool-panel">
      <div
        className="color-swatch"
        style={{ background: parseHex(form.hex) ? form.hex : '#ccc' }}
        aria-hidden
      />
      <label className="tool-field">
        <span className="tool-field__label">HEX</span>
        <div className="tool-inline-row">
          <input
            className="tool-input tool-input--grow"
            value={form.hex}
            onChange={(e) => onHex(e.target.value)}
          />
          <button type="button" className="tool-btn" onClick={() => void copy(form.hex)}>
            复制
          </button>
        </div>
      </label>
      <div className="tool-triple">
        {(['r', 'g', 'b'] as const).map((k) => (
          <label key={k} className="tool-field">
            <span className="tool-field__label">{k.toUpperCase()}</span>
            <input
              className="tool-input"
              type="number"
              min={0}
              max={255}
              value={form[k]}
              onChange={(e) => onRgb(k, e.target.value)}
            />
          </label>
        ))}
      </div>
      <div className="tool-actions">
        <button type="button" className="tool-btn" onClick={() => void copy(formatRgb(rgb))}>
          复制 RGB
        </button>
      </div>
      <div className="tool-triple">
        {(
          [
            ['h', 'H'],
            ['s', 'S%'],
            ['l', 'L%']
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="tool-field">
            <span className="tool-field__label">{label}</span>
            <input
              className="tool-input"
              type="number"
              value={form[k]}
              onChange={(e) => onHsl(k, e.target.value)}
            />
          </label>
        ))}
      </div>
      <div className="tool-actions">
        <button type="button" className="tool-btn" onClick={() => void copy(formatHsl(hsl))}>
          复制 HSL
        </button>
      </div>
      {error ? <p className="tool-error">{error}</p> : null}
    </div>
  )
}
