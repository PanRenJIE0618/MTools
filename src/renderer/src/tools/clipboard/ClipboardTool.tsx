import { useCallback, useEffect, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

type ClipboardItem = { id: string; text: string; at: number }

export default function ClipboardTool(): React.JSX.Element {
  const [items, setItems] = useState<ClipboardItem[]>([])

  const refresh = useCallback(async () => {
    const list = await window.mtools.clipHistory()
    setItems(list)
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), 1500)
    return () => window.clearInterval(id)
  }, [refresh])

  return (
    <div className="tool-panel">
      <p className="tool-field__label" style={{ margin: 0 }}>
        自动记录近期复制的文本（仅本机会话内）
      </p>
      <div className="tool-actions">
        <button type="button" className="tool-btn" onClick={() => void refresh()}>
          刷新
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={() => {
            void window.mtools.clipClear().then(() => {
              setItems([])
              toastBus.show('已清空')
            })
          }}
        >
          清空历史
        </button>
      </div>
      <ul className="clip-list">
        {items.map((item) => (
          <li key={item.id} className="clip-item">
            <pre className="clip-item__text">{item.text}</pre>
            <button
              type="button"
              className="tool-btn tool-btn--primary"
              onClick={() => {
                void window.mtools.clipWrite(item.text).then(() => toastBus.show('已写入剪切板'))
              }}
            >
              再次复制
            </button>
          </li>
        ))}
      </ul>
      {items.length === 0 ? <p className="tool-grid__empty">暂无记录，去复制一些文本试试</p> : null}
    </div>
  )
}
