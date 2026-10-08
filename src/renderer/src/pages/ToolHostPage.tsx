import { Navigate, useParams } from 'react-router-dom'
import ToolPageHeader from '../components/ToolPageHeader'
import Base64Tool from '../tools/base64/Base64Tool'
import HashTool from '../tools/hash/HashTool'
import JsonTool from '../tools/json/JsonTool'
import TimestampTool from '../tools/timestamp/TimestampTool'
import UrlTool from '../tools/url/UrlTool'
import UuidTool from '../tools/uuid/UuidTool'
import DiffTool from '../tools/diff/DiffTool'
import RegexTool from '../tools/regex/RegexTool'

type ToolEntry = {
  title: string
  description: string
  Component: () => React.JSX.Element
}

const TOOL_MAP: Record<string, ToolEntry> = {
  json: {
    title: 'JSON 格式化',
    description: '格式化与压缩 JSON 文本',
    Component: JsonTool
  },
  base64: {
    title: 'Base64',
    description: 'Base64 编码与解码',
    Component: Base64Tool
  },
  url: {
    title: 'URL 编解码',
    description: 'URL 编码与解码',
    Component: UrlTool
  },
  timestamp: {
    title: '时间戳',
    description: '时间戳与日期互转',
    Component: TimestampTool
  },
  hash: {
    title: 'Hash',
    description: '计算常见哈希值',
    Component: HashTool
  },
  uuid: {
    title: 'UUID',
    description: '生成 UUID',
    Component: UuidTool
  },
  diff: {
    title: '文本对比',
    description: '对比两段文本差异',
    Component: DiffTool
  },
  regex: {
    title: '正则测试',
    description: '测试正则表达式匹配',
    Component: RegexTool
  }
}

export default function ToolHostPage(): React.JSX.Element {
  const { toolId } = useParams<{ toolId: string }>()
  const entry = toolId ? TOOL_MAP[toolId] : undefined

  if (!entry) {
    return <Navigate to="/" replace />
  }

  const { title, description, Component } = entry

  return (
    <div className="tool-page">
      <ToolPageHeader title={title} description={description} />
      <Component />
    </div>
  )
}
