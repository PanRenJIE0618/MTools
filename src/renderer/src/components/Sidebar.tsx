import { CATEGORY_LABELS } from '../lib/categoryLabels'
import { useCategoryFilter, type CategoryFilter } from '../lib/categoryContext'

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as CategoryFilter[]

export default function Sidebar(): React.JSX.Element {
  const { category, setCategory } = useCategoryFilter()

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">MTools</div>
      <nav className="sidebar__nav" aria-label="工具分类">
        {CATEGORY_KEYS.map((key) => (
          <button
            key={key}
            type="button"
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
