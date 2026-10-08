import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { Tool } from '../../../shared/tool'
import { fadeIn, staggerGrid } from '../lib/motion'
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
  const reduceMotion = useReducedMotion()

  if (loading && tools.length === 0) {
    return <p className="tool-grid__loading">加载中…</p>
  }
  if (!loading && tools.length === 0) {
    return (
      <motion.p
        className="tool-grid__empty"
        variants={fadeIn}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        没有匹配的工具
      </motion.p>
    )
  }

  return (
    <div className="tool-grid-wrap">
      <AnimatePresence>
        {loading ? (
          <motion.p
            className="tool-grid__refreshing"
            aria-live="polite"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            刷新中…
          </motion.p>
        ) : null}
      </AnimatePresence>
      <motion.div
        className="tool-grid"
        variants={staggerGrid}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
        key={tools.map((t) => t.id).join('|')}
      >
        {tools.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            onClick={onCardClick}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </motion.div>
    </div>
  )
}
