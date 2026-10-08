import { describe, expect, it } from 'vitest'
import { parseHex, rgbToHex, rgbToHsl, hslToRgb } from '../src/renderer/src/tools/color/colorMath'

describe('colorMath', () => {
  it('parses hex and round-trips', () => {
    const rgb = parseHex('#2F6FED')
    expect(rgb).toEqual({ r: 47, g: 111, b: 237 })
    expect(rgbToHex(rgb!)).toBe('#2F6FED')
  })

  it('converts rgb to hsl and back approximately', () => {
    const rgb = { r: 255, g: 0, b: 0 }
    const hsl = rgbToHsl(rgb)
    expect(Math.round(hsl.h)).toBe(0)
    const back = hslToRgb(hsl)
    expect(back.r).toBe(255)
    expect(back.g).toBe(0)
    expect(back.b).toBe(0)
  })
})
