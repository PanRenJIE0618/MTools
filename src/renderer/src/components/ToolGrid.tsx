import type { Tool } from '../../../shared/tool'
import ToolCard from './ToolCard'

type ToolGridProps = {
  tools: Tool[]
  loading?: boolean
  onCardClick: (tool: Tool) => void
  onEdit?: (tool: Tool) => void
  onDelete?: (tool: Tool) => void
}

export default function ToolGrid({
  tools,
  loading,
  onCardClick,
  onEdit,
  onDelete
}: ToolGridProps): React.JSX.Element {
  if (loading && tools.length === 0) {
    return <p className="tool-grid__loading">加载中…</p>
  }
  if (!loading && tools.length === 0) {
    return <p className="tool-grid__empty">没有匹配的工具</p>
  }
  return (
    <div className="tool-grid-wrap">
      {loading ? (
        <p className="tool-grid__refreshing" aria-live="polite">
          刷新中…
        </p>
      ) : null}
      <div className="tool-grid">
        {tools.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            onClick={onCardClick}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
