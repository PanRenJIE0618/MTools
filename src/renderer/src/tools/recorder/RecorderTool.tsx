import { useCallback, useEffect, useRef, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

type Source = { id: string; name: string; thumbnailDataUrl: string }

export default function RecorderTool(): React.JSX.Element {
  const [sources, setSources] = useState<Source[]>([])
  const [sourceId, setSourceId] = useState('')
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState('')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    void window.mtools.screenList().then((list) => {
      setSources(list)
      if (list[0]) setSourceId(list[0].id)
    })
  }, [])

  const stop = useCallback(async () => {
    const rec = mediaRef.current
    if (!rec) return
    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve()
      rec.stop()
    })
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    mediaRef.current = null
    setRecording(false)

    const blob = new Blob(chunksRef.current, { type: 'video/webm' })
    chunksRef.current = []
    const buf = new Uint8Array(await blob.arrayBuffer())
    const savePath =
      (await window.mtools.pickSave(`mtools-record-${Date.now()}.webm`)) ||
      `mtools-record-${Date.now()}.webm`
    const r = await window.mtools.writeBinary(savePath, buf)
    if (!r.ok) {
      setError(r.error || '保存失败')
      return
    }
    toastBus.show(`录屏已保存：${savePath}`)
  }, [])

  const start = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          // @ts-expect-error Electron desktop capturer constraint
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId
          }
        }
      })
      streamRef.current = stream
      chunksRef.current = []
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
      mediaRef.current = rec
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.start(500)
      setRecording(true)
      toastBus.show('开始录屏')
    } catch (e) {
      setError(e instanceof Error ? e.message : '无法开始录屏')
    }
  }, [sourceId])

  return (
    <div className="tool-panel">
      <p className="tool-field__label" style={{ margin: 0 }}>
        选择屏幕或窗口后开始录制，停止后保存为 WebM
      </p>
      <label className="tool-field">
        <span className="tool-field__label">录制源</span>
        <select
          className="tool-input tool-input--grow"
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          disabled={recording}
        >
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <div className="tool-actions">
        {!recording ? (
          <button type="button" className="tool-btn tool-btn--primary" onClick={() => void start()}>
            开始录屏
          </button>
        ) : (
          <button type="button" className="tool-btn" onClick={() => void stop()}>
            停止并保存
          </button>
        )}
      </div>
      {error ? <p className="tool-error">{error}</p> : null}
    </div>
  )
}
