import { useCallback, useEffect, useRef, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

type Tool = 'pen' | 'rect' | 'arrow' | 'text' | 'mosaic' | 'crop'

type Props = {
  dataUrl: string
  onDiscard: () => void
  onSaved: (path: string) => void
}

const HISTORY_MAX = 30
const COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#111111', '#ffffff']
const TOOLS: { id: Tool; label: string; key: string }[] = [
  { id: 'pen', label: '画笔', key: '1' },
  { id: 'rect', label: '矩形', key: '2' },
  { id: 'arrow', label: '箭头', key: '3' },
  { id: 'text', label: '文字', key: '4' },
  { id: 'mosaic', label: '马赛克', key: '5' },
  { id: 'crop', label: '裁剪', key: '6' }
]
const ZOOM_MIN = 0.25
const ZOOM_MAX = 4

function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100))
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth: number
): void {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const head = Math.max(12, lineWidth * 4)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1 - ux * head * 0.6, y1 - uy * head * 0.6)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - ux * head - uy * head * 0.45, y1 - uy * head + ux * head * 0.45)
  ctx.lineTo(x1 - ux * head + uy * head * 0.45, y1 - uy * head - ux * head * 0.45)
  ctx.closePath()
  ctx.fill()
}

function applyMosaic(
  base: HTMLCanvasElement,
  overlay: HTMLCanvasElement,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  block = 12
): void {
  const left = Math.max(0, Math.min(x0, x1))
  const top = Math.max(0, Math.min(y0, y1))
  const right = Math.min(base.width, Math.max(x0, x1))
  const bottom = Math.min(base.height, Math.max(y0, y1))
  const w = right - left
  const h = bottom - top
  if (w < 2 || h < 2) return

  const tmp = document.createElement('canvas')
  tmp.width = base.width
  tmp.height = base.height
  const tctx = tmp.getContext('2d')!
  tctx.drawImage(base, 0, 0)
  tctx.drawImage(overlay, 0, 0)

  const ctx = overlay.getContext('2d')!
  for (let y = top; y < bottom; y += block) {
    for (let x = left; x < right; x += block) {
      const bw = Math.min(block, right - x)
      const bh = Math.min(block, bottom - y)
      const data = tctx.getImageData(x, y, bw, bh).data
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      const n = bw * bh
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]!
        g += data[i + 1]!
        b += data[i + 2]!
        a += data[i + 3]!
      }
      ctx.fillStyle = `rgba(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)},${a / n / 255})`
      ctx.fillRect(x, y, bw, bh)
    }
  }
}

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出失败'))), 'image/png')
  })
  return new Uint8Array(await blob.arrayBuffer())
}

export default function ScreenshotEditor({
  dataUrl,
  onDiscard,
  onSaved
}: Props): React.JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const draftRef = useRef<HTMLCanvasElement>(null)

  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState(COLORS[0]!)
  const [lineWidth, setLineWidth] = useState(3)
  const [zoom, setZoom] = useState(1)
  const [ready, setReady] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pendingCrop, setPendingCrop] = useState<{
    x0: number
    y0: number
    x1: number
    y1: number
  } | null>(null)
  const [textDraft, setTextDraft] = useState<{
    x: number
    y: number
    value: string
  } | null>(null)
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })

  const historyRef = useRef<ImageData[]>([])
  const redoRef = useRef<ImageData[]>([])
  const drawingRef = useRef(false)
  const startRef = useRef({ x: 0, y: 0 })
  const lastRef = useRef({ x: 0, y: 0 })
  const toolRef = useRef(tool)
  const textDraftRef = useRef(textDraft)
  const pendingCropRef = useRef(pendingCrop)
  const busyRef = useRef(busy)

  toolRef.current = tool
  textDraftRef.current = textDraft
  pendingCropRef.current = pendingCrop
  busyRef.current = busy

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(historyRef.current.length > 0)
    setCanRedo(redoRef.current.length > 0)
  }, [])

  const pushHistory = useCallback(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    const ctx = overlay.getContext('2d')
    if (!ctx) return
    historyRef.current.push(ctx.getImageData(0, 0, overlay.width, overlay.height))
    if (historyRef.current.length > HISTORY_MAX) historyRef.current.shift()
    redoRef.current = []
    syncHistoryFlags()
  }, [syncHistoryFlags])

  const clearDraft = useCallback(() => {
    const draft = draftRef.current
    if (!draft) return
    draft.getContext('2d')!.clearRect(0, 0, draft.width, draft.height)
  }, [])

  const selectTool = useCallback(
    (next: Tool) => {
      setTool(next)
      setPendingCrop(null)
      clearDraft()
      setTextDraft(null)
    },
    [clearDraft]
  )

  const initFromUrl = useCallback(
    async (url: string) => {
      const img = await loadImage(url)
      const base = baseRef.current
      const overlay = overlayRef.current
      const draft = draftRef.current
      if (!base || !overlay || !draft) return
      ;[base, overlay, draft].forEach((c) => {
        c.width = img.naturalWidth
        c.height = img.naturalHeight
      })
      const bctx = base.getContext('2d')!
      bctx.clearRect(0, 0, base.width, base.height)
      bctx.drawImage(img, 0, 0)
      overlay.getContext('2d')!.clearRect(0, 0, overlay.width, overlay.height)
      draft.getContext('2d')!.clearRect(0, 0, draft.width, draft.height)
      historyRef.current = []
      redoRef.current = []
      setPendingCrop(null)
      setTextDraft(null)
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
      syncHistoryFlags()
      setReady(true)

      // fit into viewport initially
      const wrap = wrapRef.current
      if (wrap) {
        const availW = Math.max(200, wrap.clientWidth - 24)
        const availH = Math.max(160, wrap.clientHeight - 24)
        const fit = Math.min(1, availW / img.naturalWidth, availH / img.naturalHeight)
        setZoom(clampZoom(fit))
      } else {
        setZoom(1)
      }
    },
    [syncHistoryFlags]
  )

  useEffect(() => {
    void initFromUrl(dataUrl).catch(() => toastBus.show('截图加载失败'))
  }, [dataUrl, initFromUrl])

  const pointerPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current!
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy
    }
  }, [])

  const composeExportCanvas = useCallback((): HTMLCanvasElement | null => {
    const base = baseRef.current
    const overlay = overlayRef.current
    if (!base || !overlay) return null
    const out = document.createElement('canvas')
    out.width = base.width
    out.height = base.height
    const ctx = out.getContext('2d')!
    ctx.drawImage(base, 0, 0)
    ctx.drawImage(overlay, 0, 0)
    return out
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!ready || textDraft) return
      e.currentTarget.setPointerCapture(e.pointerId)
      const p = pointerPos(e)
      startRef.current = p
      lastRef.current = p
      drawingRef.current = true
      setPendingCrop(null)

      if (tool === 'text') {
        drawingRef.current = false
        setTextDraft({ x: p.x, y: p.y, value: '' })
        return
      }

      if (tool === 'pen') {
        pushHistory()
        const ctx = overlayRef.current!.getContext('2d')!
        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
      }
    },
    [color, lineWidth, pointerPos, pushHistory, ready, textDraft, tool]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return
      const p = pointerPos(e)
      const s = startRef.current

      if (tool === 'pen') {
        const ctx = overlayRef.current!.getContext('2d')!
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
        lastRef.current = p
        return
      }

      const draft = draftRef.current!
      const dctx = draft.getContext('2d')!
      dctx.clearRect(0, 0, draft.width, draft.height)
      dctx.strokeStyle = tool === 'crop' || tool === 'mosaic' ? '#1e88e5' : color
      dctx.lineWidth = tool === 'crop' || tool === 'mosaic' ? 2 : lineWidth
      dctx.setLineDash(tool === 'crop' || tool === 'mosaic' ? [6, 4] : [])

      if (tool === 'rect' || tool === 'mosaic' || tool === 'crop') {
        dctx.strokeRect(s.x, s.y, p.x - s.x, p.y - s.y)
      } else if (tool === 'arrow') {
        dctx.setLineDash([])
        drawArrow(dctx, s.x, s.y, p.x, p.y, color, lineWidth)
      }
      lastRef.current = p
    },
    [color, lineWidth, pointerPos, tool]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return
      drawingRef.current = false
      const p = pointerPos(e)
      const s = startRef.current
      clearDraft()

      if (tool === 'pen') return

      if (tool === 'crop') {
        if (Math.abs(p.x - s.x) > 4 && Math.abs(p.y - s.y) > 4) {
          setPendingCrop({ x0: s.x, y0: s.y, x1: p.x, y1: p.y })
          const draft = draftRef.current!
          const dctx = draft.getContext('2d')!
          dctx.strokeStyle = '#1e88e5'
          dctx.lineWidth = 2
          dctx.setLineDash([6, 4])
          dctx.strokeRect(s.x, s.y, p.x - s.x, p.y - s.y)
        }
        return
      }

      if (tool === 'rect') {
        pushHistory()
        const ctx = overlayRef.current!.getContext('2d')!
        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        ctx.strokeRect(s.x, s.y, p.x - s.x, p.y - s.y)
        return
      }

      if (tool === 'arrow') {
        pushHistory()
        const ctx = overlayRef.current!.getContext('2d')!
        drawArrow(ctx, s.x, s.y, p.x, p.y, color, lineWidth)
        return
      }

      if (tool === 'mosaic') {
        pushHistory()
        applyMosaic(baseRef.current!, overlayRef.current!, s.x, s.y, p.x, p.y)
      }
    },
    [clearDraft, color, lineWidth, pointerPos, pushHistory, tool]
  )

  const commitText = useCallback(() => {
    if (!textDraft) return
    const value = textDraft.value.trim()
    if (value) {
      pushHistory()
      const ctx = overlayRef.current!.getContext('2d')!
      ctx.fillStyle = color
      ctx.font = `${Math.max(14, lineWidth * 6)}px "Segoe UI", "Microsoft YaHei", sans-serif`
      ctx.textBaseline = 'top'
      ctx.fillText(value, textDraft.x, textDraft.y)
    }
    setTextDraft(null)
  }, [color, lineWidth, pushHistory, textDraft])

  const undo = useCallback(() => {
    const overlay = overlayRef.current
    if (!overlay || historyRef.current.length === 0) return
    const ctx = overlay.getContext('2d')!
    redoRef.current.push(ctx.getImageData(0, 0, overlay.width, overlay.height))
    const prev = historyRef.current.pop()!
    ctx.putImageData(prev, 0, 0)
    syncHistoryFlags()
  }, [syncHistoryFlags])

  const redo = useCallback(() => {
    const overlay = overlayRef.current
    if (!overlay || redoRef.current.length === 0) return
    const ctx = overlay.getContext('2d')!
    historyRef.current.push(ctx.getImageData(0, 0, overlay.width, overlay.height))
    const next = redoRef.current.pop()!
    ctx.putImageData(next, 0, 0)
    syncHistoryFlags()
  }, [syncHistoryFlags])

  const reset = useCallback(() => {
    void initFromUrl(dataUrl)
  }, [dataUrl, initFromUrl])

  const applyCrop = useCallback(() => {
    if (!pendingCrop) return
    const base = baseRef.current!
    const overlay = overlayRef.current!
    const draft = draftRef.current!
    const left = Math.max(0, Math.round(Math.min(pendingCrop.x0, pendingCrop.x1)))
    const top = Math.max(0, Math.round(Math.min(pendingCrop.y0, pendingCrop.y1)))
    const right = Math.min(base.width, Math.round(Math.max(pendingCrop.x0, pendingCrop.x1)))
    const bottom = Math.min(base.height, Math.round(Math.max(pendingCrop.y0, pendingCrop.y1)))
    const w = right - left
    const h = bottom - top
    if (w < 2 || h < 2) {
      setPendingCrop(null)
      clearDraft()
      return
    }

    const composed = composeExportCanvas()!
    const cropped = document.createElement('canvas')
    cropped.width = w
    cropped.height = h
    cropped.getContext('2d')!.drawImage(composed, left, top, w, h, 0, 0, w, h)

    ;[base, overlay, draft].forEach((c) => {
      c.width = w
      c.height = h
    })
    base.getContext('2d')!.drawImage(cropped, 0, 0)
    overlay.getContext('2d')!.clearRect(0, 0, w, h)
    clearDraft()
    historyRef.current = []
    redoRef.current = []
    setPendingCrop(null)
    setNaturalSize({ w, h })
    syncHistoryFlags()
    toastBus.show('已裁剪')
  }, [clearDraft, composeExportCanvas, pendingCrop, syncHistoryFlags])

  const save = useCallback(async () => {
    if (busyRef.current) return
    const out = composeExportCanvas()
    if (!out) return
    setBusy(true)
    try {
      const path = await window.mtools.pickSave(`mtools-shot-${Date.now()}.png`)
      if (!path) return
      const bytes = await canvasToPngBytes(out)
      const r = await window.mtools.writeBinary(path, bytes)
      if (!r.ok) {
        toastBus.show(r.error || '保存失败')
        return
      }
      onSaved(path)
    } finally {
      setBusy(false)
    }
  }, [composeExportCanvas, onSaved])

  const copy = useCallback(async () => {
    if (busyRef.current) return
    const out = composeExportCanvas()
    if (!out) return
    setBusy(true)
    try {
      const r = await window.mtools.clipWriteImage(out.toDataURL('image/png'))
      if (!r.ok) {
        toastBus.show(r.error || '复制失败')
        return
      }
      toastBus.show('已复制到剪贴板')
    } finally {
      setBusy(false)
    }
  }, [composeExportCanvas])

  const zoomBy = useCallback((delta: number) => {
    setZoom((z) => clampZoom(z + delta))
  }, [])

  const fitZoom = useCallback(() => {
    const wrap = wrapRef.current
    if (!wrap || !naturalSize.w) return
    const availW = Math.max(200, wrap.clientWidth - 24)
    const availH = Math.max(160, wrap.clientHeight - 24)
    setZoom(clampZoom(Math.min(1, availW / naturalSize.w, availH / naturalSize.h)))
  }, [naturalSize.h, naturalSize.w])

  // Ctrl + wheel zoom
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      const step = e.deltaY > 0 ? -0.1 : 0.1
      setZoom((z) => clampZoom(z + step))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [ready])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      if (typing) {
        if (e.key === 'Escape') {
          setTextDraft(null)
        }
        return
      }

      const mod = e.ctrlKey || e.metaKey

      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
        return
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void save()
        return
      }
      if (mod && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        void copy()
        return
      }
      if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        zoomBy(0.1)
        return
      }
      if (mod && e.key === '-') {
        e.preventDefault()
        zoomBy(-0.1)
        return
      }
      if (mod && e.key === '0') {
        e.preventDefault()
        setZoom(1)
        return
      }
      if (e.key === 'Enter' && pendingCropRef.current) {
        e.preventDefault()
        applyCrop()
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        if (pendingCropRef.current) {
          setPendingCrop(null)
          clearDraft()
          return
        }
        if (textDraftRef.current) {
          setTextDraft(null)
          return
        }
        onDiscard()
        return
      }

      const toolHit = TOOLS.find((t) => t.key === e.key)
      if (toolHit && !mod) {
        e.preventDefault()
        selectTool(toolHit.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [applyCrop, clearDraft, copy, onDiscard, redo, save, selectTool, undo, zoomBy])

  const displayW = naturalSize.w ? Math.round(naturalSize.w * zoom) : undefined

  return (
    <div className="shot-editor">
      <div className="shot-editor__toolbar">
        <div className="shot-editor__group">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              title={`${t.label} (${t.key})`}
              className={tool === t.id ? 'tool-btn tool-btn--primary' : 'tool-btn'}
              onClick={() => selectTool(t.id)}
            >
              {t.label}
              <span className="shot-editor__kbd">{t.key}</span>
            </button>
          ))}
        </div>
        <div className="shot-editor__group">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={
                color === c
                  ? 'shot-editor__swatch shot-editor__swatch--active'
                  : 'shot-editor__swatch'
              }
              style={{ background: c }}
              aria-label={c}
              onClick={() => setColor(c)}
            />
          ))}
          <label className="shot-editor__width">
            线宽
            <input
              type="range"
              min={1}
              max={16}
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="shot-editor__group">
          <button
            type="button"
            className="tool-btn"
            disabled={!canUndo}
            title="撤销 (Ctrl+Z)"
            onClick={undo}
          >
            撤销
          </button>
          <button
            type="button"
            className="tool-btn"
            disabled={!canRedo}
            title="重做 (Ctrl+Y)"
            onClick={redo}
          >
            重做
          </button>
          <button type="button" className="tool-btn" title="重置标注" onClick={reset}>
            重置
          </button>
          {pendingCrop ? (
            <button
              type="button"
              className="tool-btn tool-btn--primary"
              title="确认裁剪 (Enter)"
              onClick={applyCrop}
            >
              确认裁剪
            </button>
          ) : null}
        </div>
        <div className="shot-editor__group">
          <button
            type="button"
            className="tool-btn"
            title="缩小 (Ctrl+-)"
            onClick={() => zoomBy(-0.1)}
          >
            −
          </button>
          <span className="shot-editor__zoom-label">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="tool-btn"
            title="放大 (Ctrl+=)"
            onClick={() => zoomBy(0.1)}
          >
            +
          </button>
          <button type="button" className="tool-btn" title="实际大小 (Ctrl+0)" onClick={() => setZoom(1)}>
            100%
          </button>
          <button type="button" className="tool-btn" title="适应窗口" onClick={fitZoom}>
            适应
          </button>
        </div>
        <div className="shot-editor__group shot-editor__group--end">
          <button
            type="button"
            className="tool-btn"
            disabled={busy}
            title="放弃 (Esc)"
            onClick={onDiscard}
          >
            放弃
          </button>
          <button
            type="button"
            className="tool-btn"
            disabled={busy}
            title="复制 (Ctrl+C)"
            onClick={() => void copy()}
          >
            复制
          </button>
          <button
            type="button"
            className="tool-btn tool-btn--primary"
            disabled={busy}
            title="保存 (Ctrl+S)"
            onClick={() => void save()}
          >
            保存
          </button>
        </div>
      </div>
      <p className="shot-editor__shortcuts">
        快捷键：1–6 切换工具 · Ctrl+Z/Y 撤销重做 · Ctrl+S 保存 · Ctrl+C 复制 · Ctrl+滚轮/+/-
        缩放 · Esc 取消/放弃
      </p>

      <div className="shot-editor__canvas-wrap" ref={wrapRef}>
        <div
          className="shot-editor__stack"
          style={displayW ? { width: displayW, maxWidth: 'none' } : undefined}
        >
          <canvas
            ref={baseRef}
            className="shot-editor__layer shot-editor__layer--base"
            style={displayW ? { width: displayW, maxWidth: 'none' } : undefined}
          />
          <canvas ref={overlayRef} className="shot-editor__layer shot-editor__layer--paint" />
          <canvas
            ref={draftRef}
            className="shot-editor__layer shot-editor__layer--draft"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          {textDraft && overlayRef.current ? (
            <input
              className="shot-editor__text-input"
              style={{
                left: `${(textDraft.x / overlayRef.current.width) * 100}%`,
                top: `${(textDraft.y / overlayRef.current.height) * 100}%`,
                color,
                fontSize: `clamp(12px, ${Math.max(14, lineWidth * 6) * zoom}px, 64px)`
              }}
              autoFocus
              value={textDraft.value}
              placeholder="输入文字后回车"
              onChange={(e) => setTextDraft({ ...textDraft, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitText()
                if (e.key === 'Escape') {
                  e.stopPropagation()
                  setTextDraft(null)
                }
              }}
              onBlur={commitText}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
