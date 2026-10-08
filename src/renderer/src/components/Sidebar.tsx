import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CATEGORY_LABELS } from '../lib/categoryLabels'
import { useCategoryFilter, type CategoryFilter } from '../lib/categoryContext'
import { springSnappy } from '../lib/motion'

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as CategoryFilter[]

export default function Sidebar(): React.JSX.Element {
  const { category, setCategory } = useCategoryFilter()
  const reduceMotion = useReducedMotion()
  const navRef = useRef<HTMLElement>(null)
  const btnRefs = useRef<Map<CategoryFilter, HTMLButtonElement>>(new Map())
  const [pill, setPill] = useState({ top: 0, height: 0 })

  useEffect(() => {
    const btn = btnRefs.current.get(category)
    const nav = navRef.current
    if (!btn || !nav) return
    const navRect = nav.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    setPill({ top: btnRect.top - navRect.top, height: btnRect.height })
  }, [category])

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark" aria-hidden />
        MTools
      </div>
      <nav className="sidebar__nav" aria-label="工具分类" ref={navRef}>
        {!reduceMotion && pill.height > 0 && (
          <motion.div
            className="sidebar__active-pill"
            aria-hidden
            initial={false}
            animate={{ top: pill.top, height: pill.height }}
            transition={springSnappy}
          />
        )}
        {CATEGORY_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            ref={(el) => {
              if (el) btnRefs.current.set(key, el)
              else btnRefs.current.delete(key)
            }}
            className={
              category === key ? 'sidebar__btn sidebar__btn--active' : 'sidebar__btn'
            }
            onClick={() => setCategory(key)}
          >
            {CATEGORY_LABELS[key]}
          </button>
        ))}
      </nav>
    </aside>
  )
}
