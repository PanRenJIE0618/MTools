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
  onEdit?: (tool: Tool) => void
  onDelete?: (tool: Tool) => void
}

export default function ToolCard({
  tool,
  onClick,
  onEdit,
  onDelete
}: ToolCardProps): React.JSX.Element {
  return (
    <div className="tool-card">
      <button type="button" className="tool-card__main" onClick={() => onClick(tool)}>
        <div className="tool-card__head">
          <h3 className="tool-card__name">{tool.name}</h3>
          <span className="tool-card__badge">{KIND_LABELS[tool.kind]}</span>
        </div>
        <p className="tool-card__desc">{tool.description}</p>
      </button>
      {!tool.builtin && (
        <div className="tool-card__actions">
          <button
            type="button"
            className="tool-card__action"
            onClick={() => onEdit?.(tool)}
          >
            编辑
          </button>
          <button
            type="button"
            className="tool-card__action tool-card__action--danger"
            onClick={() => onDelete?.(tool)}
          >
            删除
          </button>
        </div>
      )}
    </div>
  )
}
