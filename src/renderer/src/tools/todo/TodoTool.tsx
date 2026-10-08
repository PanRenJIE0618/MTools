import { useCallback, useEffect, useMemo, useState } from 'react'
import { toastBus } from '../../lib/toastBus'
import { loadTodos, saveTodos, todayIso, type Todo } from '../../lib/todos'

function statusClass(item: Todo): string {
  const classes = ['todo-item']
  if (item.done) classes.push('todo-item--done')
  if (!item.done && item.endDate && item.endDate < todayIso()) {
    classes.push('todo-item--overdue')
  }
  return classes.join(' ')
}

export default function TodoTool(): React.JSX.Element {
  const [items, setItems] = useState<Todo[]>([])
  const [text, setText] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void loadTodos().then((next) => {
      setItems(next)
      void saveTodos(next)
    })
  }, [])

  const persist = useCallback(async (next: Todo[]) => {
    setItems(next)
    await saveTodos(next)
  }, [])

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      const ae = a.endDate || '9999-99-99'
      const be = b.endDate || '9999-99-99'
      if (ae !== be) return ae.localeCompare(be)
      return b.createdAt.localeCompare(a.createdAt)
    })
  }, [items])

  const add = useCallback(() => {
    const t = text.trim()
    if (!t) {
      setError('请填写待办内容')
      return
    }
    const createdAt = todayIso()
    if (endDate && endDate < createdAt) {
      setError('结束日期不能早于创建日期')
      return
    }
    setError('')
    void persist([
      {
        id: `t-${Date.now()}`,
        text: t,
        done: false,
        createdAt,
        endDate: endDate || undefined
      },
      ...items
    ])
    setText('')
    setEndDate('')
  }, [endDate, items, persist, text])

  const updateEndDate = useCallback(
    (id: string, nextEnd: string) => {
      const item = items.find((x) => x.id === id)
      if (!item) return
      if (nextEnd && nextEnd < item.createdAt) {
        toastBus.show('结束日期不能早于创建日期')
        return
      }
      void persist(
        items.map((x) =>
          x.id === id ? { ...x, endDate: nextEnd || undefined } : x
        )
      )
    },
    [items, persist]
  )

  return (
    <div className="tool-panel">
      <label className="tool-field">
        <span className="tool-field__label">内容</span>
        <input
          className="tool-input tool-input--grow"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
          }}
          placeholder="添加待办…"
        />
      </label>
      <div className="todo-date-row">
        <label className="tool-field">
          <span className="tool-field__label">创建日期</span>
          <input className="tool-input" type="date" value={todayIso()} disabled readOnly />
        </label>
        <label className="tool-field">
          <span className="tool-field__label">结束日期</span>
          <input
            className="tool-input"
            type="date"
            value={endDate}
            min={todayIso()}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <div className="todo-date-row__action">
          <button type="button" className="tool-btn tool-btn--primary" onClick={add}>
            添加
          </button>
        </div>
      </div>
      {error ? <p className="tool-error">{error}</p> : null}

      <ul className="todo-list">
        {sorted.map((item) => (
          <li key={item.id} className={statusClass(item)}>
            <div className="todo-item__main">
              <label className="todo-item__label">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => {
                    void persist(
                      items.map((x) => {
                        if (x.id !== item.id) return x
                        const done = !x.done
                        if (done && !x.endDate) {
                          return { ...x, done, endDate: todayIso() }
                        }
                        return { ...x, done }
                      })
                    )
                  }}
                />
                <span>{item.text}</span>
              </label>
              <div className="todo-item__meta">
                创建 {item.createdAt}
                {item.endDate ? ` · 结束 ${item.endDate}` : ' · 未设结束日期'}
                {!item.done && item.endDate && item.endDate < todayIso() ? ' · 已逾期' : ''}
              </div>
              <div className="todo-date-row todo-date-row--compact">
                <label className="tool-field">
                  <span className="tool-field__label">创建日期</span>
                  <input
                    className="tool-input"
                    type="date"
                    value={item.createdAt}
                    disabled
                    readOnly
                  />
                </label>
                <label className="tool-field">
                  <span className="tool-field__label">结束日期</span>
                  <input
                    className="tool-input"
                    type="date"
                    value={item.endDate ?? ''}
                    min={item.createdAt}
                    onChange={(e) => updateEndDate(item.id, e.target.value)}
                  />
                </label>
              </div>
            </div>
            <button
              type="button"
              className="tool-card__action tool-card__action--danger"
              onClick={() => {
                void persist(items.filter((x) => x.id !== item.id))
                toastBus.show('已删除')
              }}
            >
              删除
            </button>
          </li>
        ))}
      </ul>
      {items.length === 0 ? <p className="tool-grid__empty">暂无待办</p> : null}
    </div>
  )
}
