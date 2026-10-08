import { useCallback, useEffect, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

type Todo = { id: string; text: string; done: boolean }

export default function TodoTool(): React.JSX.Element {
  const [items, setItems] = useState<Todo[]>([])
  const [text, setText] = useState('')

  useEffect(() => {
    void window.mtools.storeGet('todos').then((data) => {
      if (Array.isArray(data)) setItems(data as Todo[])
    })
  }, [])

  const persist = useCallback(async (next: Todo[]) => {
    setItems(next)
    await window.mtools.storeSet('todos', next)
  }, [])

  const add = useCallback(() => {
    const t = text.trim()
    if (!t) return
    void persist([{ id: `t-${Date.now()}`, text: t, done: false }, ...items])
    setText('')
  }, [items, persist, text])

  return (
    <div className="tool-panel">
      <div className="tool-inline-row">
        <input
          className="tool-input tool-input--grow"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
          }}
          placeholder="添加待办…"
        />
        <button type="button" className="tool-btn tool-btn--primary" onClick={add}>
          添加
        </button>
      </div>
      <ul className="todo-list">
        {items.map((item) => (
          <li key={item.id} className={item.done ? 'todo-item todo-item--done' : 'todo-item'}>
            <label className="todo-item__label">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => {
                  void persist(
                    items.map((x) => (x.id === item.id ? { ...x, done: !x.done } : x))
                  )
                }}
              />
              <span>{item.text}</span>
            </label>
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
