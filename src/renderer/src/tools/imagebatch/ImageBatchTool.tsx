import { useCallback, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

export default function ImageBatchTool(): React.JSX.Element {
  const [paths, setPaths] = useState<string[]>([])
  const [outDir, setOutDir] = useState('')
  const [maxWidth, setMaxWidth] = useState(1280)
  const [format, setFormat] = useState<'png' | 'jpg'>('jpg')
  const [error, setError] = useState('')
  const [written, setWritten] = useState<string[]>([])

  const pickFiles = useCallback(async () => {
    const files = await window.mtools.pickFiles([
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'] }
    ])
    setPaths(files)
  }, [])

  const pickFolder = useCallback(async () => {
    const dir = await window.mtools.pickDir()
    if (!dir) return
    const imgs = await window.mtools.listImages(dir)
    setPaths(imgs)
  }, [])

  const pickOut = useCallback(async () => {
    const dir = await window.mtools.pickDir()
    if (dir) setOutDir(dir)
  }, [])

  const run = useCallback(async () => {
    if (!paths.length || !outDir) {
      setError('请选择图片与输出目录')
      return
    }
    setError('')
    const r = await window.mtools.imageBatch({
      paths,
      outDir,
      maxWidth,
      format,
      quality: 85
    })
    if (!r.ok) {
      setError(r.error || '处理失败')
      setWritten([])
      return
    }
    setWritten(r.written)
    toastBus.show(`已输出 ${r.written.length} 张`)
  }, [format, maxWidth, outDir, paths])

  return (
    <div className="tool-panel">
      <div className="tool-actions">
        <button type="button" className="tool-btn tool-btn--primary" onClick={() => void pickFiles()}>
          选择图片
        </button>
        <button type="button" className="tool-btn" onClick={() => void pickFolder()}>
          从文件夹导入
        </button>
        <button type="button" className="tool-btn" onClick={() => void pickOut()}>
          输出目录
        </button>
      </div>
      <p className="tool-field__label">已选 {paths.length} 张 · 输出：{outDir || '未选择'}</p>
      <label className="tool-field">
        <span className="tool-field__label">最大宽度（px）</span>
        <input
          className="tool-input"
          type="number"
          min={64}
          max={8192}
          value={maxWidth}
          onChange={(e) => setMaxWidth(Number(e.target.value) || 1280)}
        />
      </label>
      <label className="tool-field">
        <span className="tool-field__label">格式</span>
        <select
          className="tool-input"
          value={format}
          onChange={(e) => setFormat(e.target.value as 'png' | 'jpg')}
        >
          <option value="jpg">JPG</option>
          <option value="png">PNG</option>
        </select>
      </label>
      <div className="tool-actions">
        <button type="button" className="tool-btn tool-btn--primary" onClick={() => void run()}>
          开始处理
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
