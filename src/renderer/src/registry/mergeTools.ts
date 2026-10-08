import type { Tool } from '../types/tool'

export function mergeTools(builtin: Tool[], external: Tool[]): Tool[] {
  const builtinIds = new Set(builtin.map(t => t.id))
  const safeExternal = external.filter(t => !builtinIds.has(t.id) && !t.builtin)
  return [...builtin, ...safeExternal]
}
