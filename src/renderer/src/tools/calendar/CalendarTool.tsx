import { useCallback, useEffect, useMemo, useState } from 'react'
import { toastBus } from '../../lib/toastBus'
import {
  createTodo,
  loadTodos,
  saveTodos,
  todoOnDate,
  type Todo
} from '../../lib/todos'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatDateTime(d: Date): string {
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function buildCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const startWeekday = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function CalendarTool(): React.JSX.Element {
  const [now, setNow] = useState(() => new Date())
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [selected, setSelected] = useState(() => new Date())
  const [todos, setTodos] = useState<Todo[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [modalError, setModalError] = useState('')

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const refreshTodos = useCallback(async () => {
    setTodos(await loadTodos())
  }, [])

  useEffect(() => {
    void refreshTodos()
  }, [refreshTodos])

  // 回到日历页时刷新，便于与待办工具同步
  useEffect(() => {
    const onFocus = () => {
      void refreshTodos()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshTodos])

  const cells = useMemo(
    () => buildCells(cursor.year, cursor.month),
    [cursor.month, cursor.year]
  )

  const selectedIso = formatDate(selected)

  const dayTodos = useMemo(() => {
    // 未完成在前，同组内按添加时间倒序（反向）
    return todos
      .filter((t) => todoOnDate(t, selectedIso))
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1
        return b.id.localeCompare(a.id)
      })
  }, [selectedIso, todos])

  const todoCountByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of todos) {
      // 覆盖本月可见日期即可
      for (const cell of cells) {
        if (!cell) continue
        const iso = formatDate(cell)
        if (todoOnDate(t, iso)) {
          map.set(iso, (map.get(iso) ?? 0) + 1)
        }
      }
    }
    return map
  }, [cells, todos])

  const shiftMonth = useCallback((delta: number) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }, [])

  const goToday = useCallback(() => {
    const d = new Date()
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
    setSelected(d)
  }, [])

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toastBus.show('已复制')
    } catch {
      toastBus.show('复制失败')
    }
  }, [])

  const weekOfYear = useMemo(() => {
    const d = new Date(selected)
    d.setHours(0, 0, 0, 0)
    const oneJan = new Date(d.getFullYear(), 0, 1)
    const dayMs = 86400000
    return Math.ceil(((d.getTime() - oneJan.getTime()) / dayMs + oneJan.getDay() + 1) / 7)
  }, [selected])

  const dayOfYear = useMemo(() => {
    const start = new Date(selected.getFullYear(), 0, 0)
    return Math.floor((selected.getTime() - start.getTime()) / 86400000)
  }, [selected])

  const openAddModal = useCallback(() => {
    setDraft('')
    setModalError('')
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setDraft('')
    setModalError('')
  }, [])

  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeModal, modalOpen])

  const confirmAddTodo = useCallback(async () => {
    const text = draft.trim()
    if (!text) {
      setModalError('请填写待办内容')
      return
    }
    const next = [createTodo(text, selectedIso), ...todos]
    setTodos(next)
    await saveTodos(next)
    toastBus.show('已添加待办')
    closeModal()
  }, [closeModal, draft, selectedIso, todos])

  const toggleTodo = useCallback(
    async (id: string) => {
      const next = todos.map((x) => {
        if (x.id !== id) return x
        const done = !x.done
        if (done && !x.endDate) {
          return { ...x, done, endDate: selectedIso }
        }
        return { ...x, done }
      })
      setTodos(next)
      await saveTodos(next)
    },
    [selectedIso, todos]
  )

  return (
    <div className="tool-panel cal-layout">
      <div className="cal-now">
        <div className="cal-now__time">{formatDateTime(now)}</div>
        <div className="cal-now__meta">
          本地时区 · Unix {Math.floor(now.getTime() / 1000)}
        </div>
        <div className="tool-actions">
          <button
            type="button"
            className="tool-btn"
            onClick={() => void copyText(formatDateTime(now))}
          >
            复制当前时间
          </button>
          <button
            type="button"
            className="tool-btn"
            onClick={() => void copyText(String(Math.floor(now.getTime() / 1000)))}
          >
            复制时间戳
          </button>
        </div>
      </div>

      <div className="cal-panel">
        <div className="cal-toolbar">
          <button type="button" className="tool-btn" onClick={() => shiftMonth(-1)}>
            上月
          </button>
          <div className="cal-toolbar__title">
            {cursor.year} 年 {cursor.month + 1} 月
          </div>
          <button type="button" className="tool-btn" onClick={() => shiftMonth(1)}>
            下月
          </button>
          <button type="button" className="tool-btn tool-btn--primary" onClick={goToday}>
            今天
          </button>
        </div>

        <div className="cal-grid" role="grid" aria-label="月历">
          {WEEKDAYS.map((w) => (
            <div key={w} className="cal-grid__head">
              {w}
            </div>
          ))}
          {cells.map((day, i) => {
            if (!day) {
              return <div key={`e-${i}`} className="cal-grid__cell cal-grid__cell--empty" />
            }
            const isToday = sameDay(day, now)
            const isSelected = sameDay(day, selected)
            const iso = formatDate(day)
            const count = todoCountByDay.get(iso) ?? 0
            return (
              <button
                key={iso}
                type="button"
                className={[
                  'cal-grid__cell',
                  isToday ? 'cal-grid__cell--today' : '',
                  isSelected ? 'cal-grid__cell--selected' : '',
                  count > 0 ? 'cal-grid__cell--has-todo' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setSelected(day)}
              >
                <span className="cal-grid__day">{day.getDate()}</span>
                {count > 0 ? (
                  <span className="cal-grid__dots" aria-label={`${count} 条待办`}>
                    {Math.min(count, 3)}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="cal-detail">
        <h3 className="cal-detail__title">选中日期</h3>
        <dl className="cal-detail__list">
          <div>
            <dt>日期</dt>
            <dd>{selectedIso}</dd>
          </div>
          <div>
            <dt>星期</dt>
            <dd>星期{WEEKDAYS[selected.getDay()]}</dd>
          </div>
          <div>
            <dt>今年第几天</dt>
            <dd>{dayOfYear}</dd>
          </div>
          <div>
            <dt>今年第几周</dt>
            <dd>{weekOfYear}</dd>
          </div>
          <div>
            <dt>时间戳（0 点）</dt>
            <dd>
              {Math.floor(
                new Date(
                  selected.getFullYear(),
                  selected.getMonth(),
                  selected.getDate()
                ).getTime() / 1000
              )}
            </dd>
          </div>
        </dl>
        <div className="tool-actions">
          <button type="button" className="tool-btn tool-btn--primary" onClick={openAddModal}>
            添加待办
          </button>
          <button
            type="button"
            className="tool-btn"
            onClick={() => void copyText(selectedIso)}
          >
            复制日期
          </button>
          <button
            type="button"
            className="tool-btn"
            onClick={() =>
              void copyText(
                String(
                  Math.floor(
                    new Date(
                      selected.getFullYear(),
                      selected.getMonth(),
                      selected.getDate()
                    ).getTime() / 1000
                  )
                )
              )
            }
          >
            复制当日时间戳
          </button>
        </div>

        <div className="cal-todos">
          <h4 className="cal-todos__title">当日待办（{dayTodos.length}）</h4>
          {dayTodos.length === 0 ? (
            <p className="cal-todos__empty">这一天还没有待办</p>
          ) : (
            <ul className="cal-todos__list">
              {dayTodos.map((item) => (
                <li
                  key={item.id}
                  className={
                    item.done ? 'cal-todos__item cal-todos__item--done' : 'cal-todos__item'
                  }
                >
                  <label className="cal-todos__label">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => void toggleTodo(item.id)}
                    />
                    <span>{item.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {modalOpen ? (
        <div
          className="modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cal-todo-modal-title"
          >
            <h2 id="cal-todo-modal-title" className="modal__title">
              添加待办 · {selectedIso}
            </h2>
            <form
              className="modal__form"
              onSubmit={(e) => {
                e.preventDefault()
                void confirmAddTodo()
              }}
            >
              <label className="modal__field">
                <span className="modal__label">待办事项</span>
                <input
                  className="modal__input"
                  value={draft}
                  autoFocus
                  placeholder="输入待办内容…"
                  onChange={(e) => setDraft(e.target.value)}
                />
              </label>
              {modalError ? <p className="modal__error">{modalError}</p> : null}
              <div className="modal__actions">
                <button
                  type="button"
                  className="modal__btn modal__btn--ghost"
                  onClick={closeModal}
                >
                  取消
                </button>
                <button type="submit" className="modal__btn modal__btn--primary">
                  确认
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
