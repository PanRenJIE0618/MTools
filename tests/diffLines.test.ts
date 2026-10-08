import { describe, it, expect } from 'vitest'
import { diffLines } from '../src/renderer/src/tools/diff/diffLines'

describe('diffLines', () => {
  it('detects changed middle line', () => {
    const r = diffLines('a\nb\nc', 'a\nx\nc')
    expect(r.some(x => x.type === 'del' && x.text === 'b')).toBe(true)
    expect(r.some(x => x.type === 'add' && x.text === 'x')).toBe(true)
  })
})
