import { describe, it, expect } from 'vitest'
import { hashText } from '../src/renderer/src/tools/hash/hashText'

describe('hashText', () => {
  it('md5 of empty string', () => {
    expect(hashText('MD5', '')).toBe('d41d8cd98f00b204e9800998ecf8427e')
  })
})
