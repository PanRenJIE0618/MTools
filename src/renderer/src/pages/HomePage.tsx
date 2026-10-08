import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Tool } from '../../../shared/tool'
import SearchBar from '../components/SearchBar'
import ToolGrid from '../components/ToolGrid'
import { useCategoryFilter } from '../lib/categoryContext'
import { toastBus } from '../lib/toastBus'
import { useTools } from '../hooks/useTools'

export default function HomePage(): React.JSX.Element {
  const { tools, loading, launch } = useTools()
  const { category } = useCategoryFilter()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(
    () =>
      tools.filter((t) => {
        const catOk = category === 'all' || t.category === category
        const q = query.trim().toLowerCase()
        const qOk =
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
        return catOk && qOk
      }),
    [tools, category, query]
  )

  const handleCardClick = useCallback(
    async (tool: Tool) => {
      if (tool.kind === 'builtin') {
        navigate(tool.route!)
        return
      }
      const result = await launch(tool)
      if (!result.ok) {
        toastBus.show(result.error ?? '启动失败')
      }
    },
    [launch, navigate]
  )

  const handleAdd = useCallback(() => {
    // Task 6: add-tool modal
  }, [])

  return (
    <div className="home-page">
      <div className="home-page__toolbar">
        <SearchBar value={query} onChange={setQuery} />
        <button type="button" className="btn-add-tool" onClick={handleAdd}>
          添加工具
        </button>
      </div>
      <ToolGrid tools={filtered} loading={loading} onCardClick={handleCardClick} />
    </div>
  )
}
