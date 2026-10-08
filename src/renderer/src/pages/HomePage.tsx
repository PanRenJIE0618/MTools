import { useCallback, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { Tool } from '../../../shared/tool'
import AddToolModal from '../components/AddToolModal'
import SearchBar from '../components/SearchBar'
import ToolGrid from '../components/ToolGrid'
import ToolStage3D from '../components/ToolStage3D'
import { useCategoryFilter } from '../lib/categoryContext'
import { fadeUp } from '../lib/motion'
import { toastBus } from '../lib/toastBus'
import { useTools } from '../hooks/useTools'

export default function HomePage(): React.JSX.Element {
  const { tools, loading, launch, saveExternals, error } = useTools()
  const { category } = useCategoryFilter()
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Tool | null>(null)
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

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

  const externals = useMemo(() => tools.filter((t) => !t.builtin), [tools])

  const persist = useCallback(
    async (nextExternals: Tool[]): Promise<boolean> => {
      try {
        await saveExternals(nextExternals)
        toastBus.show('已保存')
        return true
      } catch {
        toastBus.show('保存失败，请重试')
        return false
      }
    },
    [saveExternals]
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
    setEditing(null)
    setModalOpen(true)
  }, [])

  const handleEdit = useCallback((tool: Tool) => {
    setEditing(tool)
    setModalOpen(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setModalOpen(false)
    setEditing(null)
  }, [])

  const handleSave = useCallback(
    async (tool: Tool) => {
      const exists = externals.some((t) => t.id === tool.id)
      const next = exists
        ? externals.map((t) => (t.id === tool.id ? tool : t))
        : [...externals, tool]
      const ok = await persist(next)
      if (!ok) return
      setModalOpen(false)
      setEditing(null)
    },
    [externals, persist]
  )

  const handleDelete = useCallback(
    async (tool: Tool) => {
      if (!window.confirm('确定删除该外挂？')) return
      const next = externals.filter((t) => t.id !== tool.id)
      const ok = await persist(next)
      if (!ok) return
    },
    [externals, persist]
  )

  return (
    <motion.div
      className="home-page"
      variants={fadeUp}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div className="home-page__chrome">
        {error ? (
          <div className="home-page__error" role="alert">
            {error}
          </div>
        ) : null}
        <header className="home-page__heading">
          <h1 className="home-page__title">工具箱</h1>
          <p className="home-page__subtitle">内置开发工具与本地外挂，一处集中使用</p>
        </header>
        <div className="home-page__toolbar">
          <SearchBar value={query} onChange={setQuery} />
          <button type="button" className="btn-add-tool" onClick={handleAdd}>
            + 添加工具
          </button>
        </div>
      </div>
      <div
        className={
          category === 'all' ? 'home-page__body home-page__body--stage' : 'home-page__body'
        }
      >
        {category === 'all' ? (
          <ToolStage3D
            tools={filtered}
            loading={loading}
            onCardClick={handleCardClick}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <ToolGrid
            tools={filtered}
            loading={loading}
            onCardClick={handleCardClick}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
      <AddToolModal
        open={modalOpen}
        initial={editing}
        onClose={handleModalClose}
        onSave={(tool) => void handleSave(tool)}
      />
    </motion.div>
  )
}
