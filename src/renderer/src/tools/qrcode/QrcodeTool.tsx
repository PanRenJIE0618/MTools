import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { toastBus } from '../../lib/toastBus'

export default function QrcodeTool(): React.JSX.Element {
  const [text, setText] = useState('https://')
  const [dataUrl, setDataUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const value = text.trim()
    if (!value) {
      setDataUrl('')
      setError('')
      return
    }
    QRCode.toDataURL(value, {
      width: 280,
      margin: 2,
      color: { dark: '#14181f', light: '#ffffff' }
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url)
          setError('')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl('')
          setError('无法生成二维码')
        }
      })
    return () => {
      cancelled = true
    }
  }, [text])

  const handleDownload = useCallback(() => {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'qrcode.png'
    a.click()
    toastBus.show('已开始下载')
  }, [dataUrl])

  const handleCopyImage = useCallback(async () => {
    if (!dataUrl) return
    try {
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      toastBus.show('已复制图片')
    } catch {
      toastBus.show('复制失败，可改用下载')
    }
  }, [dataUrl])

  return (
    <div className="tool-panel">
      <label className="tool-field">
        <span className="tool-field__label">内容</span>
        <textarea
          className="tool-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入链接或文本…"
          rows={4}
        />
      </label>
      <div className="qrcode-preview">
        {dataUrl ? (
          <img src={dataUrl} alt="二维码预览" className="qrcode-preview__img" />
        ) : (
          <p className="tool-grid__empty">输入内容以生成二维码</p>
        )}
      </div>
      {error ? <p className="tool-error">{error}</p> : null}
      <div className="tool-actions">
        <button
          type="button"
          className="tool-btn tool-btn--primary"
          onClick={handleDownload}
          disabled={!dataUrl}
        >
          下载 PNG
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={() => void handleCopyImage()}
          disabled={!dataUrl}
        >
          复制图片
        </button>
      </div>
    </div>
  )
}
