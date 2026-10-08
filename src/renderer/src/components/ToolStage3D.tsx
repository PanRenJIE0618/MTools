import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion, type Transition } from 'framer-motion'
import type { Tool, ToolKind } from '../../../shared/tool'

const KIND_LABELS: Record<ToolKind, string> = {
  builtin: '内置',
  app: '应用',
  script: '脚本',
  url: '链接'
}

const MAX_OFFSET = 3

const stageTransition: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 26,
  mass: 0.85
}

type ToolStage3DProps = {
  tools: Tool[]
  loading?: boolean
  onCardClick: (tool: Tool) => void
  onEdit?: (tool: Tool) => void
  onDelete?: (tool: Tool) => void
}

/** Shortest wrapped distance from active index to item index. */
function wrappedOffset(itemIndex: number, activeIndex: number, length: number): number {
  let raw = itemIndex - activeIndex
  const half = length / 2
  if (raw > half) raw -= length
  if (raw < -half) raw += length
  return raw
}

function cardAnimate(offset: number, reduceMotion: boolean | null) {
  const abs = Math.abs(offset)
  if (reduceMotion) {
    return {
      opacity: abs > 2 ? 0 : 1 - abs * 0.2,
      x: offset * 200,
      scale: offset === 0 ? 1 : 0.92,
      rotateY: 0,
      z: 0,
      transformPerspective: 1200
    }
  }
  return {
    opacity: abs > MAX_OFFSET ? 0 : Math.max(0.35, 1 - abs * 0.18),
    x: offset * 155,
    z: -abs * 140,
    rotateY: offset * -48,
    scale: Math.max(0.7, 1 - abs * 0.11),
    transformPerspective: 1200
  }
}

export default function ToolStage3D({
  tools,
  loading,
  onCardClick,
  onEdit,
  onDelete
}: ToolStage3DProps): React.JSX.Element {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const wheelLock = useRef(false)

  useEffect(() => {
    setIndex((i) => (tools.length ? Math.min(i, tools.length - 1) : 0))
  }, [tools])

  const active = tools[index] ?? null

  const go = useCallback(
    (delta: number) => {
      if (!tools.length) return
      setIndex((i) => (i + delta + tools.length) % tools.length)
    },
    [tools.length]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      }
      if (e.key === 'Enter' && active) onCardClick(active)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, go, onCardClick])

  const items = useMemo(() => {
    return tools
      .map((tool, i) => ({
        tool,
        offset: wrappedOffset(i, index, tools.length)
      }))
      .filter((item) => Math.abs(item.offset) <= MAX_OFFSET)
      .sort((a, b) => Math.abs(b.offset) - Math.abs(a.offset))
  }, [index, tools])

  if (loading && tools.length === 0) {
    return <p className="tool-grid__loading">加载中…</p>
  }
  if (!tools.length) {
    return <p className="tool-grid__empty">没有匹配的工具</p>
  }

  return (
    <div className="stage3d">
      <div
        className="stage3d__viewport"
        onWheel={(e) => {
          e.preventDefault()
          if (wheelLock.current) return
          const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX
          if (Math.abs(delta) < 6) return
          wheelLock.current = true
          go(delta > 0 ? 1 : -1)
          window.setTimeout(() => {
            wheelLock.current = false
          }, 280)
        }}
      >
        <div className="stage3d__scene">
          {items.map(({ tool, offset }) => (
            <motion.article
              key={tool.id}
              className={
                offset === 0 ? 'stage3d__card stage3d__card--active' : 'stage3d__card'
              }
              style={{ zIndex: 100 - Math.abs(offset) }}
              initial={false}
              animate={cardAnimate(offset, reduceMotion)}
              transition={stageTransition}
              onClick={() => {
                if (offset === 0) onCardClick(tool)
                else {
                  const next = tools.findIndex((t) => t.id === tool.id)
                  if (next >= 0) setIndex(next)
                }
              }}
            >
              <div className="stage3d__card-glow" aria-hidden />
              <div className="stage3d__card-head">
                <h3 className="stage3d__card-name">{tool.name}</h3>
                <span className="stage3d__card-badge">{KIND_LABELS[tool.kind]}</span>
              </div>
              <p className="stage3d__card-desc">{tool.description}</p>
              {offset === 0 && !tool.builtin ? (
                <div className="stage3d__card-actions">
                  <button
                    type="button"
                    className="tool-card__action"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit?.(tool)
                    }}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className="tool-card__action tool-card__action--danger"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete?.(tool)
                    }}
                  >
                    删除
                  </button>
                </div>
              ) : null}
            </motion.article>
          ))}
        </div>
      </div>

      <div className="stage3d__controls">
        <button type="button" className="tool-btn" onClick={() => go(-1)} aria-label="上一项">
          ←
        </button>
        <div className="stage3d__status">
          <strong>{active?.name}</strong>
          <span>
            {index + 1} / {tools.length} · 滚轮或方向键切换，回车打开
          </span>
        </div>
        <button type="button" className="tool-btn" onClick={() => go(1)} aria-label="下一项">
          →
        </button>
        <button
          type="button"
          className="tool-btn tool-btn--primary"
          onClick={() => active && onCardClick(active)}
        >
          打开
        </button>
      </div>
    </div>
  )
}
