import { describe, it, expect } from 'vitest'
import { assertSafeUrl } from '../src/main/launchTool'

describe('assertSafeUrl', () => {
  it('allows https', () => {
    expect(assertSafeUrl('https://example.com')).toBe('https://example.com/')
  })
  it('allows http', () => {
    expect(assertSafeUrl('http://example.com/path')).toBe('http://example.com/path')
  })
  it('rejects file protocol', () => {
    expect(() => assertSafeUrl('file:///C:/x')).toThrow()
  })
})
