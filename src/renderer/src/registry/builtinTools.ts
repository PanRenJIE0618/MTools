import type { Tool } from '../../../shared/tool'

export const builtinTools: Tool[] = [
  {
    id: 'json',
    name: 'JSON 格式化',
    description: '格式化与压缩 JSON 文本',
    category: 'dev',
    kind: 'builtin',
    route: '/tools/json',
    builtin: true
  },
  {
    id: 'base64',
    name: 'Base64',
    description: 'Base64 编码与解码',
    category: 'encode',
    kind: 'builtin',
    route: '/tools/base64',
    builtin: true
  },
  {
    id: 'url',
    name: 'URL 编解码',
    description: 'URL 编码与解码',
    category: 'encode',
    kind: 'builtin',
    route: '/tools/url',
    builtin: true
  },
  {
    id: 'timestamp',
    name: '时间戳',
    description: '时间戳与日期互转',
    category: 'dev',
    kind: 'builtin',
    route: '/tools/timestamp',
    builtin: true
  },
  {
    id: 'hash',
    name: 'Hash',
    description: '计算常见哈希值',
    category: 'encode',
    kind: 'builtin',
    route: '/tools/hash',
    builtin: true
  },
  {
    id: 'uuid',
    name: 'UUID',
    description: '生成 UUID',
    category: 'dev',
    kind: 'builtin',
    route: '/tools/uuid',
    builtin: true
  },
  {
    id: 'diff',
    name: '文本对比',
    description: '对比两段文本差异',
    category: 'text',
    kind: 'builtin',
    route: '/tools/diff',
    builtin: true
  },
  {
    id: 'regex',
    name: '正则测试',
    description: '测试正则表达式匹配',
    category: 'text',
    kind: 'builtin',
    route: '/tools/regex',
    builtin: true
  }
]
