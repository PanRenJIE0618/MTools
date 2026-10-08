import { Navigate, useParams } from 'react-router-dom'
import ToolPageHeader from '../components/ToolPageHeader'
import Base64Tool from '../tools/base64/Base64Tool'
import JsonTool from '../tools/json/JsonTool'
import UrlTool from '../tools/url/UrlTool'

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
