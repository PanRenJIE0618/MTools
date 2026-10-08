import { useCallback, useEffect, useState } from 'react'
import { toastBus } from '../../lib/toastBus'
import ScreenshotEditor from './ScreenshotEditor'
import ScreenshotRegionPicker from './ScreenshotRegionPicker'

type Source = { id: string; name: string; thumbnailDataUrl: string }
type Stage =
  | { kind: 'pick' }
  | { kind: 'region'; dataUrl: string }
  | { kind: 'edit'; dataUrl: string }

export default function ScreenshotTool(): React.JSX.Element {
  const [sources, setSources] = useState<Source[]>([])
  const [selected, setSelected] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState<Stage>({ kind: 'pick' })

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
    setBusy(true)
    setError('')
    try {
      const r = await window.mtools.screenCapture(selected)
      if (!r.ok || !r.dataUrl) {
        setError(r.error || '截图失败')
        return
      }
      setStage({ kind: 'region', dataUrl: r.dataUrl })
    } finally {
      setBusy(false)
    }
  }, [selected])

  if (stage.kind === 'region') {
    return (
      <ScreenshotRegionPicker
        dataUrl={stage.dataUrl}
        onCancel={() => setStage({ kind: 'pick' })}
        onConfirm={(dataUrl) => setStage({ kind: 'edit', dataUrl })}
      />
    )
  }

  if (stage.kind === 'edit') {
    return (
      <ScreenshotEditor
        dataUrl={stage.dataUrl}
        onDiscard={() => setStage({ kind: 'pick' })}
        onSaved={(path) => {
          toastBus.show(`已保存：${path}`)
          setStage({ kind: 'pick' })
        }}
      />
    )
  }

  return (
    <div className="tool-panel">
      <div className="tool-actions">
        <button type="button" className="tool-btn" onClick={() => void refresh()} disabled={busy}>
          刷新源
        </button>
        <button
          type="button"
          className="tool-btn tool-btn--primary"
          onClick={() => void capture()}
          disabled={busy || !selected}
        >
          截图并编辑
        </button>
      </div>
      <p className="tool-hint">截图后可拖拽划分区域，再进入标注编辑。</p>
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
