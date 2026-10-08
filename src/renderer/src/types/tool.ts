export type ToolKind = 'builtin' | 'app' | 'script' | 'url'

export type ToolCategory = 'dev' | 'encode' | 'text' | 'external'

export interface Tool {
  id: string
  name: string
  description: string
  category: ToolCategory
  kind: ToolKind
  route?: string
  target?: string
  args?: string
  icon?: string
  builtin: boolean
}
