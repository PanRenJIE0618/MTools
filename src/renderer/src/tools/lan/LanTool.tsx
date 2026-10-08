import { useCallback, useEffect, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

export default function LanTool(): React.JSX.Element {
  const [running, setRunning] = useState(false)
  const [urls, setUrls] = useState<string[]>([])
  const [dir, setDir] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const s = await window.mtools.lanStatus()
    setRunning(s.running)
    setUrls(s.urls)
    setDir(s.dir)
    if (s.running) setFiles(await window.mtools.lanFiles())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <div className="tool-panel">
      <p className="tool-field__label" style={{ margin: 0 }}>
        在同一局域网内通过浏览器上传/下载共享文件
      </p>
      <div className="tool-actions">
        {!running ? (
          <button
            type="button"
            className="tool-btn tool-btn--primary"
            onClick={() => {
              void window.mtools.lanStart().then((r) => {
                if (!r.ok) {
                  setError(r.error || '启动失败')
                  return
                }
                setError('')
                setRunning(true)
                setUrls(r.urls || [])
                setDir(r.dir || '')
                toastBus.show('局域网服务已启动')
                void window.mtools.lanFiles().then(setFiles)
              })
            }}
          >
            启动服务
          </button>
        ) : (
          <button
            type="button"
            className="tool-btn"
            onClick={() => {
              void window.mtools.lanStop().then(() => {
                setRunning(false)
                toastBus.show('已停止')
                void refresh()
              })
            }}
          >
            停止服务
          </button>
        )}
        <button type="button" className="tool-btn" onClick={() => void refresh()}>
          刷新
        </button>
      </div>
      {error ? <p className="tool-error">{error}</p> : null}
      {running ? (
        <>
          <p className="tool-field__label">访问地址</p>
          <ul className="rename-preview">
            {urls.map((u) => (
              <li key={u}>
                <code>{u}</code>
                <button
                  type="button"
                  className="tool-btn"
                  style={{ marginLeft: 8 }}
                  onClick={() => {
                    void navigator.clipboard.writeText(u).then(() => toastBus.show('已复制'))
                  }}
                >
                  复制
                </button>
              </li>
            ))}
          </ul>
          <p className="tool-field__label">共享目录：{dir}</p>
          <p className="tool-field__label">文件（{files.length}）</p>
          <ul className="rename-preview">
            {files.map((f) => (
              <li key={f}>
                <code>{f}</code>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="tool-grid__empty">服务未运行</p>
      )}
    </div>
  )
}
