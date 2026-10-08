import { useCallback, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

type Mode = 'prefix' | 'suffix' | 'replace' | 'sequence'

export default function RenameTool(): React.JSX.Element {
  const [paths, setPaths] = useState<string[]>([])
  const [mode, setMode] = useState<Mode>('sequence')
  const [value, setValue] = useState('file_')
  const [replaceWith, setReplaceWith] = useState('')
  const [preview, setPreview] = useState<{ from: string; to: string }[]>([])
  const [error, setError] = useState('')

  const pick = useCallback(async () => {
    const files = await window.mtools.pickFiles()
    setPaths(files)
    setPreview([])
  }, [])

  const doPreview = useCallback(async () => {
    const pairs = await window.mtools.previewRename(paths, {
      mode,
      value,
      replaceWith,
      start: 1,
      pad: 3
    })
    setPreview(pairs)
  }, [mode, paths, replaceWith, value])

  const apply = useCallback(async () => {
    if (!preview.length) await doPreview()
    const pairs =
      preview.length > 0
        ? preview
        : await window.mtools.previewRename(paths, {
            mode,
            value,
            replaceWith,
            start: 1,
            pad: 3
          })
    const r = await window.mtools.applyRename(pairs)
    if (!r.ok) {
      setError(r.error || '重命名失败')
      return
    }
    setError('')
    toastBus.show(`已重命名 ${r.count} 个文件`)
    setPaths(pairs.map((p) => p.to))
    setPreview([])
  }, [doPreview, mode, paths, preview, replaceWith, value])

  return (
    <div className="tool-panel">
      <div className="tool-actions">
        <button type="button" className="tool-btn tool-btn--primary" onClick={() => void pick()}>
          选择文件
        </button>
        <span className="tool-field__label">已选 {paths.length} 个</span>
      </div>
      <label className="tool-field">
        <span className="tool-field__label">规则</span>
        <select
          className="tool-input"
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
        >
          <option value="sequence">序号命名</option>
          <option value="prefix">添加前缀</option>
          <option value="suffix">添加后缀</option>
          <option value="replace">替换片段</option>
        </select>
      </label>
      <label className="tool-field">
        <span className="tool-field__label">
          {mode === 'replace' ? '查找' : mode === 'sequence' ? '前缀' : '内容'}
        </span>
        <input className="tool-input tool-input--grow" value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
      {mode === 'replace' ? (
        <label className="tool-field">
          <span className="tool-field__label">替换为</span>
          <input
            className="tool-input tool-input--grow"
            value={replaceWith}
            onChange={(e) => setReplaceWith(e.target.value)}
          />
        </label>
      ) : null}
      <div className="tool-actions">
        <button type="button" className="tool-btn" onClick={() => void doPreview()} disabled={!paths.length}>
          预览
        </button>
        <button type="button" className="tool-btn tool-btn--primary" onClick={() => void apply()} disabled={!paths.length}>
          执行重命名
        </button>
      </div>
      {error ? <p className="tool-error">{error}</p> : null}
      <ul className="rename-preview">
        {(preview.length ? preview : paths.map((p) => ({ from: p, to: p }))).map((p) => (
          <li key={p.from}>
            <code>{p.from.split(/[/\\]/).pop()}</code>
            {preview.length ? (
              <>
                {' → '}
                <code>{p.to.split(/[/\\]/).pop()}</code>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
