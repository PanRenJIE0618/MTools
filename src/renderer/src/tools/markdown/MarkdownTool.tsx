import { useCallback, useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { toastBus } from '../../lib/toastBus'

type Note = { id: string; title: string; body: string; updatedAt: number }

export default function MarkdownTool(): React.JSX.Element {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    void window.mtools.storeGet('markdown-notes').then((data) => {
      if (Array.isArray(data) && data.length) {
        const list = data as Note[]
        setNotes(list)
        setActiveId(list[0].id)
      }
    })
  }, [])

  const active = notes.find((n) => n.id === activeId) ?? null
  const html = useMemo(() => {
    if (!active) return ''
    return DOMPurify.sanitize(marked.parse(active.body, { async: false }) as string)
  }, [active])

  const persist = useCallback(async (next: Note[]) => {
    setNotes(next)
    await window.mtools.storeSet('markdown-notes', next)
  }, [])

  const createNote = useCallback(() => {
    const n: Note = {
      id: `n-${Date.now()}`,
      title: '未命名笔记',
      body: '# 新笔记\n\n开始书写…',
      updatedAt: Date.now()
    }
    void persist([n, ...notes])
    setActiveId(n.id)
  }, [notes, persist])

  const updateActive = useCallback(
    (patch: Partial<Note>) => {
      if (!active) return
      void persist(
        notes.map((n) =>
          n.id === active.id ? { ...n, ...patch, updatedAt: Date.now() } : n
        )
      )
    },
    [active, notes, persist]
  )

  return (
    <div className="tool-panel md-layout">
      <div className="md-sidebar">
        <button type="button" className="tool-btn tool-btn--primary" onClick={createNote}>
          新建笔记
        </button>
        <ul className="md-list">
          {notes.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={
                  n.id === activeId ? 'md-list__btn md-list__btn--active' : 'md-list__btn'
                }
                onClick={() => setActiveId(n.id)}
              >
                {n.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {active ? (
        <div className="md-editor">
          <input
            className="tool-input tool-input--grow"
            value={active.title}
            onChange={(e) => updateActive({ title: e.target.value })}
          />
          <div className="md-split">
            <textarea
              className="tool-textarea"
              value={active.body}
              onChange={(e) => updateActive({ body: e.target.value })}
              rows={16}
            />
            <div className="md-preview" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
          <div className="tool-actions">
            <button
              type="button"
              className="tool-btn"
              onClick={() => {
                void persist(notes.filter((n) => n.id !== active.id)).then(() => {
                  setActiveId(notes.find((n) => n.id !== active.id)?.id ?? null)
                  toastBus.show('已删除笔记')
                })
              }}
            >
              删除笔记
            </button>
          </div>
        </div>
      ) : (
        <p className="tool-grid__empty">创建笔记开始</p>
      )}
    </div>
  )
}
