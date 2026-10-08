import { useCallback, useEffect, useRef, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

type Source = { id: string; name: string; thumbnailDataUrl: string }

export default function RecorderTool(): React.JSX.Element {
  const [sources, setSources] = useState<Source[]>([])
  const [sourceId, setSourceId] = useState('')
  const [recording, setRecording] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [error, setError] = useState('')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    void window.mtools.screenList().then((list) => {
      setSources(list)
      if (list[0]) setSourceId(list[0].id)
    })
  }, [])

  const clearCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    setCountdown(null)
  }, [])

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
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

  const beginRecording = useCallback(async () => {
    if (cancelledRef.current) return
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
      if (cancelledRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
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

  const startWithCountdown = useCallback(() => {
    if (!sourceId || countdown !== null || recording) return
    setError('')
    cancelledRef.current = false
    setCountdown(3)
    let left = 3
    countdownTimerRef.current = setInterval(() => {
      left -= 1
      if (left <= 0) {
        clearCountdown()
        void beginRecording()
        return
      }
      setCountdown(left)
    }, 1000)
  }, [beginRecording, clearCountdown, countdown, recording, sourceId])

  const cancelCountdown = useCallback(() => {
    cancelledRef.current = true
    clearCountdown()
    toastBus.show('已取消录屏')
  }, [clearCountdown])

  const counting = countdown !== null

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
          disabled={recording || counting}
        >
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <div className="tool-actions">
        {!recording && !counting ? (
          <button
            type="button"
            className="tool-btn tool-btn--primary"
            disabled={!sourceId}
            onClick={startWithCountdown}
          >
            开始录屏
          </button>
        ) : null}
        {counting ? (
          <button type="button" className="tool-btn" onClick={cancelCountdown}>
            取消倒计时
          </button>
        ) : null}
        {recording ? (
          <button type="button" className="tool-btn" onClick={() => void stop()}>
            停止并保存
          </button>
        ) : null}
      </div>
      {error ? <p className="tool-error">{error}</p> : null}

      {counting ? (
        <div className="record-countdown" role="status" aria-live="assertive">
          <div className="record-countdown__card">
            <p className="record-countdown__label">即将开始录屏</p>
            <div key={countdown} className="record-countdown__num">
              {countdown}
            </div>
            <p className="record-countdown__tip">请切换到要录制的窗口</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
