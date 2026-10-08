import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { Tool, ToolCategory, ToolKind } from '../../../shared/tool'
import { CATEGORY_LABELS } from '../lib/categoryLabels'
import { modalOverlay, modalPanel } from '../lib/motion'

const EXTERNAL_KINDS: Exclude<ToolKind, 'builtin'>[] = ['app', 'script', 'url']

const KIND_OPTIONS: { value: Exclude<ToolKind, 'builtin'>; label: string }[] = [
  { value: 'app', label: '应用' },
  { value: 'script', label: '脚本' },
  { value: 'url', label: '链接' }
]

const CATEGORY_OPTIONS: ToolCategory[] = [
  'dev',
  'encode',
  'text',
  'productivity',
  'media',
  'network',
  'external'
]

type AddToolModalProps = {
  open: boolean
  initial?: Tool | null
  onClose: () => void
  onSave: (tool: Tool) => void
}

type FormState = {
  name: string
  description: string
  category: ToolCategory
  kind: Exclude<ToolKind, 'builtin'>
  target: string
  args: string
}

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  category: 'external',
  kind: 'url',
  target: '',
  args: ''
})

function toolToForm(tool: Tool): FormState {
  const kind = tool.kind === 'builtin' ? 'url' : tool.kind
  return {
    name: tool.name,
    description: tool.description,
    category: tool.category,
    kind,
    target: tool.target ?? '',
    args: tool.args ?? ''
  }
}

export default function AddToolModal({
  open,
  initial,
  onClose,
  onSave
}: AddToolModalProps): React.JSX.Element {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return
    setForm(initial ? toolToForm(initial) : emptyForm())
    setError(null)
  }, [open, initial])

  const isEdit = Boolean(initial)

  function update<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    const name = form.name.trim()
    const target = form.target.trim()
    if (!name) {
      setError('请填写名称')
      return
    }
    if (!target) {
      setError('请填写路径或链接')
      return
    }
    if (form.kind === 'url' && !/^https?:\/\//i.test(target)) {
      setError('链接需以 http:// 或 https:// 开头')
      return
    }
    const tool: Tool = {
      id: initial?.id ?? `ext-${crypto.randomUUID()}`,
      name,
      description: form.description.trim(),
      category: form.category,
      kind: form.kind,
      target,
      args: form.args.trim() || undefined,
      builtin: false
    }
    onSave(tool)
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-overlay"
          role="presentation"
          onClick={onClose}
          variants={modalOverlay}
          initial={reduceMotion ? false : 'hidden'}
          animate="show"
          exit="exit"
        >
          <motion.div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-tool-modal-title"
            onClick={(e) => e.stopPropagation()}
            variants={modalPanel}
            initial={reduceMotion ? false : 'hidden'}
            animate="show"
            exit="exit"
          >
            <h2 id="add-tool-modal-title" className="modal__title">
              {isEdit ? '编辑工具' : '添加工具'}
            </h2>
            <form className="modal__form" onSubmit={handleSubmit}>
              <label className="modal__field">
                <span className="modal__label">名称</span>
                <input
                  className="modal__input"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  autoFocus
                />
              </label>
              <label className="modal__field">
                <span className="modal__label">描述</span>
                <input
                  className="modal__input"
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                />
              </label>
              <label className="modal__field">
                <span className="modal__label">分类</span>
                <select
                  className="modal__input"
                  value={form.category}
                  onChange={(e) => update('category', e.target.value as ToolCategory)}
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="modal__field">
                <span className="modal__label">类型</span>
                <select
                  className="modal__input"
                  value={form.kind}
                  onChange={(e) =>
                    update('kind', e.target.value as (typeof EXTERNAL_KINDS)[number])
                  }
                >
                  {KIND_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="modal__field">
                <span className="modal__label">
                  {form.kind === 'url'
                    ? '链接'
                    : form.kind === 'script'
                      ? '脚本路径'
                      : '应用路径'}
                </span>
                <input
                  className="modal__input"
                  value={form.target}
                  onChange={(e) => update('target', e.target.value)}
                  placeholder={form.kind === 'url' ? 'https://' : ''}
                />
              </label>
              {form.kind !== 'url' && (
                <label className="modal__field">
                  <span className="modal__label">参数（可选）</span>
                  <input
                    className="modal__input"
                    value={form.args}
                    onChange={(e) => update('args', e.target.value)}
                  />
                </label>
              )}
              {error && <p className="modal__error">{error}</p>}
              <div className="modal__actions">
                <button
                  type="button"
                  className="modal__btn modal__btn--ghost"
                  onClick={onClose}
                >
                  取消
                </button>
                <button type="submit" className="modal__btn modal__btn--primary">
                  保存
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
