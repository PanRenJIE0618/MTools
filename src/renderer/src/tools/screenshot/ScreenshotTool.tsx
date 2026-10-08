import { useCallback, useEffect, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

type Source = { id: string; name: string; thumbnailDataUrl: string }

export default function ScreenshotTool(): React.JSX.Element {
  const [sources, setSources] = useState<Source[]>([])
  const [selected, setSelected] = useState('')
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const list = await window.mtools.screenList()
    setSources(list)
    if (list[0]) setSelected((id) => id || list[0].id)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const capture = useCallback(async () => {
    if (!selected) return
    const r = await window.mtools.screenCapture(selected)
    if (!r.ok) {
      setError(r.error || '截图失败')
      return
    }
    setError('')
    toastBus.show(`已保存：${r.path}`)
  }, [selected])

  return (
    <div className="tool-panel">
      <div className="tool-actions">
        <button type="button" className="tool-btn" onClick={() => void refresh()}>
          刷新源
        </button>
        <button type="button" className="tool-btn tool-btn--primary" onClick={() => void capture()}>
          截图并保存
        </button>
      </div>
      {error ? <p className="tool-error">{error}</p> : null}
      <div className="screen-grid">
        {sources.map((s) => (
          <button
            key={s.id}
            type="button"
            className={
              selected === s.id ? 'screen-card screen-card--active' : 'screen-card'
            }
            onClick={() => setSelected(s.id)}
          >
            <img src={s.thumbnailDataUrl} alt={s.name} />
            <span>{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
