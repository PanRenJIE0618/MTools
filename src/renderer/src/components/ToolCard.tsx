import type { Tool, ToolKind } from '../../../shared/tool'

const KIND_LABELS: Record<ToolKind, string> = {
  builtin: '内置',
  app: '应用',
  script: '脚本',
  url: '链接'
}

type ToolCardProps = {
  tool: Tool
  onClick: (tool: Tool) => void
}

export default function ToolCard({ tool, onClick }: ToolCardProps): React.JSX.Element {
  return (
    <button type="button" className="tool-card" onClick={() => onClick(tool)}>
      <div className="tool-card__head">
        <h3 className="tool-card__name">{tool.name}</h3>
        <span className="tool-card__badge">{KIND_LABELS[tool.kind]}</span>
      </div>
      <p className="tool-card__desc">{tool.description}</p>
    </button>
  )
}
