import type { Tool } from '../../../shared/tool'

export const builtinTools: Tool[] = [
  // 开发
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
    id: 'jwt',
    name: 'JWT 解析',
    description: '解码 JWT Header / Payload',
    category: 'dev',
    kind: 'builtin',
    route: '/tools/jwt',
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
    id: 'uuid',
    name: 'UUID',
    description: '生成 UUID',
    category: 'dev',
    kind: 'builtin',
    route: '/tools/uuid',
    builtin: true
  },
  {
    id: 'password',
    name: '密码生成',
    description: '生成随机安全密码',
    category: 'dev',
    kind: 'builtin',
    route: '/tools/password',
    builtin: true
  },
  {
    id: 'radix',
    name: '进制转换',
    description: '二进制 / 八 / 十 / 十六进制互转',
    category: 'dev',
    kind: 'builtin',
    route: '/tools/radix',
    builtin: true
  },
  {
    id: 'calculator',
    name: '计算器',
    description: '表达式计算器',
    category: 'dev',
    kind: 'builtin',
    route: '/tools/calculator',
    builtin: true
  },
  {
    id: 'calendar',
    name: '日期时间日历',
    description: '月历查看、当前时间与日期详情',
    category: 'dev',
    kind: 'builtin',
    route: '/tools/calendar',
    builtin: true
  },
  // 编码
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
    id: 'hash',
    name: 'Hash',
    description: '计算常见哈希值',
    category: 'encode',
    kind: 'builtin',
    route: '/tools/hash',
    builtin: true
  },
  {
    id: 'htmlentity',
    name: 'HTML 实体',
    description: 'HTML 实体编码与解码',
    category: 'encode',
    kind: 'builtin',
    route: '/tools/htmlentity',
    builtin: true
  },
  {
    id: 'qrcode',
    name: '二维码',
    description: '文本生成二维码图片',
    category: 'encode',
    kind: 'builtin',
    route: '/tools/qrcode',
    builtin: true
  },
  {
    id: 'color',
    name: '颜色转换',
    description: 'HEX / RGB / HSL 互转',
    category: 'encode',
    kind: 'builtin',
    route: '/tools/color',
    builtin: true
  },
  // 文本
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
  },
  {
    id: 'case',
    name: '命名转换',
    description: 'camel / snake / kebab 等命名风格',
    category: 'text',
    kind: 'builtin',
    route: '/tools/case',
    builtin: true
  },
  // 效率
  {
    id: 'clipboard',
    name: '剪切板',
    description: '剪切板历史与快速回写',
    category: 'productivity',
    kind: 'builtin',
    route: '/tools/clipboard',
    builtin: true
  },
  {
    id: 'todo',
    name: '待办',
    description: '轻量本地待办清单',
    category: 'productivity',
    kind: 'builtin',
    route: '/tools/todo',
    builtin: true
  },
  {
    id: 'markdown',
    name: 'Markdown 笔记',
    description: '本地 Markdown 笔记与预览',
    category: 'productivity',
    kind: 'builtin',
    route: '/tools/markdown',
    builtin: true
  },
  {
    id: 'translate',
    name: '翻译',
    description: '在线文本翻译',
    category: 'productivity',
    kind: 'builtin',
    route: '/tools/translate',
    builtin: true
  },
  {
    id: 'rename',
    name: '批量重命名',
    description: '按规则批量重命名文件',
    category: 'productivity',
    kind: 'builtin',
    route: '/tools/rename',
    builtin: true
  },
  // 媒体
  {
    id: 'screenshot',
    name: '截图',
    description: '屏幕 / 窗口截图与标注编辑',
    category: 'media',
    kind: 'builtin',
    route: '/tools/screenshot',
    builtin: true
  },
  {
    id: 'recorder',
    name: '录屏',
    description: '录制屏幕并保存 WebM',
    category: 'media',
    kind: 'builtin',
    route: '/tools/recorder',
    builtin: true
  },
  {
    id: 'imagebatch',
    name: '图片批量处理',
    description: '批量缩放与格式转换',
    category: 'media',
    kind: 'builtin',
    route: '/tools/imagebatch',
    builtin: true
  },
  {
    id: 'videobatch',
    name: '视频批量处理',
    description: '依赖 ffmpeg 的批量转码',
    category: 'media',
    kind: 'builtin',
    route: '/tools/videobatch',
    builtin: true
  },
  // 网络
  {
    id: 'network',
    name: '网络检测',
    description: '本机 IP、DNS、HTTP 延迟',
    category: 'network',
    kind: 'builtin',
    route: '/tools/network',
    builtin: true
  },
  {
    id: 'lan',
    name: '局域网传输',
    description: '局域网文件上传下载',
    category: 'network',
    kind: 'builtin',
    route: '/tools/lan',
    builtin: true
  }
]
