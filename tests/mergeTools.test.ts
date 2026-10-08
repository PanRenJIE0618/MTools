import { describe, it, expect } from 'vitest'
import { mergeTools } from '../src/renderer/src/registry/mergeTools'
import type { Tool } from '../src/renderer/src/types/tool'

const builtin: Tool[] = [{
  id: 'json', name: 'JSON', description: '', category: 'dev',
  kind: 'builtin', route: '/tools/json', builtin: true
}]

describe('mergeTools', () => {
  it('appends externals and drops id collisions', () => {
    const external: Tool[] = [
      { id: 'json', name: 'hijack', description: '', category: 'external', kind: 'app', target: 'C:\\a.exe', builtin: false },
      { id: 'my-app', name: 'My', description: '', category: 'external', kind: 'app', target: 'C:\\b.exe', builtin: false }
    ]
    const merged = mergeTools(builtin, external)
    expect(merged.map(t => t.id)).toEqual(['json', 'my-app'])
    expect(merged[0].name).toBe('JSON')
  })
})
