import { useCallback, useEffect, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

export default function VideoBatchTool(): React.JSX.Element {
  const [paths, setPaths] = useState<string[]>([])
  const [outDir, setOutDir] = useState('')
  const [mode, setMode] = useState<'mp4' | 'audio' | 'compress'>('mp4')
  const [ffmpegOk, setFfmpegOk] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [written, setWritten] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void window.mtools.ffmpegOk().then(setFfmpegOk)
  }, [])

  const run = useCallback(async () => {
    if (!paths.length || !outDir) {
      setError('请选择视频与输出目录')
      return
    }
    setBusy(true)
    setError('')
    const r = await window.mtools.videoBatch(paths, outDir, mode)
    setBusy(false)
    setFfmpegOk(r.ffmpegOk)
    if (!r.ok) {
      setError(r.error || '处理失败')
      setWritten([])
      return
    }
    setWritten(r.written)
    toastBus.show(`已处理 ${r.written.length} 个文件`)
  }, [mode, outDir, paths])

  return (
    <div className="tool-panel">
      <p className="tool-field__label" style={{ margin: 0 }}>
        依赖本机 ffmpeg（需在 PATH 中）。状态：
        {ffmpegOk === null ? '检测中…' : ffmpegOk ? '已检测到' : '未检测到'}
      </p>
      <div className="tool-actions">
        <button
          type="button"
          className="tool-btn tool-btn--primary"
          onClick={() => {
            void window.mtools
              .pickFiles([{ name: 'Video', extensions: ['mp4', 'mov', 'mkv', 'avi', 'webm'] }])
              .then(setPaths)
          }}
        >
          选择视频
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={() => {
            void window.mtools.pickDir().then((d) => d && setOutDir(d))
          }}
        >
          输出目录
        </button>
      </div>
      <p className="tool-field__label">
        已选 {paths.length} · 输出 {outDir || '未选择'}
      </p>
      <label className="tool-field">
        <span className="tool-field__label">模式</span>
        <select
          className="tool-input"
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
        >
          <option value="mp4">转 MP4</option>
          <option value="audio">提取音频 MP3</option>
          <option value="compress">压缩（约 720p）</option>
        </select>
      </label>
      <div className="tool-actions">
        <button
          type="button"
          className="tool-btn tool-btn--primary"
          disabled={busy}
          onClick={() => void run()}
        >
          {busy ? '处理中…' : '开始批量处理'}
        </button>
      </div>
      {error ? <p className="tool-error">{error}</p> : null}
      {written.length ? (
        <ul className="rename-preview">
          {written.map((w) => (
            <li key={w}>
              <code>{w}</code>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
