import { useCallback, useEffect, useRef, useState } from 'react'

type Rect = { x0: number; y0: number; x1: number; y1: number }

type Props = {
  dataUrl: string
  onConfirm: (croppedDataUrl: string) => void
  onCancel: () => void
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

function normalize(r: Rect): { left: number; top: number; width: number; height: number } {
  const left = Math.min(r.x0, r.x1)
  const top = Math.min(r.y0, r.y1)
  return {
    left,
    top,
    width: Math.abs(r.x1 - r.x0),
    height: Math.abs(r.y1 - r.y0)
  }
}

async function cropToDataUrl(src: string, rect: Rect): Promise<string> {
  const img = await loadImage(src)
  const { left, top, width, height } = normalize(rect)
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))
  const x = Math.max(0, Math.round(left))
  const y = Math.max(0, Math.round(top))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(img, x, y, w, h, 0, 0, w, h)
  return canvas.toDataURL('image/png')
}

export default function ScreenshotRegionPicker({
  dataUrl,
  onConfirm,
  onCancel
}: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const draggingRef = useRef(false)
  const startRef = useRef({ x: 0, y: 0 })

  const [ready, setReady] = useState(false)
  const [rect, setRect] = useState<Rect | null>(null)
  const [busy, setBusy] = useState(false)

  const paint = useCallback((selection: Rect | null) => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (!selection) {
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('拖拽划分截图区域 · Enter 确认 · Esc 取消', canvas.width / 2, 36)
      return
    }

    const { left, top, width, height } = normalize(selection)
    if (width < 1 || height < 1) return

    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillRect(left, top, width, height)
    ctx.restore()

    ctx.drawImage(img, left, top, width, height, left, top, width, height)

    ctx.strokeStyle = '#4da3ff'
    ctx.lineWidth = Math.max(2, canvas.width / 800)
    ctx.setLineDash([])
    ctx.strokeRect(left + 0.5, top + 0.5, width - 1, height - 1)

    // corner handles
    const hs = Math.max(6, canvas.width / 200)
    ctx.fillStyle = '#4da3ff'
    const corners = [
      [left, top],
      [left + width, top],
      [left, top + height],
      [left + width, top + height]
    ]
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx! - hs / 2, cy! - hs / 2, hs, hs)
    }

    const label = `${Math.round(width)} × ${Math.round(height)}`
    ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'left'
    const tw = ctx.measureText(label).width + 12
    const lx = Math.min(left, canvas.width - tw - 4)
    const ly = Math.max(22, top - 8)
    ctx.fillStyle = 'rgba(20, 24, 36, 0.85)'
    ctx.fillRect(lx, ly - 16, tw, 20)
    ctx.fillStyle = '#fff'
    ctx.fillText(label, lx + 6, ly)
  }, [])

  useEffect(() => {
    let cancelled = false
    void loadImage(dataUrl).then((img) => {
      if (cancelled) return
      imgRef.current = img
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      paint(null)
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [dataUrl, paint])

  useEffect(() => {
    paint(rect)
  }, [paint, rect])

  const toImagePoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const r = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height
    }
  }, [])

  const confirmSelection = useCallback(async () => {
    if (!rect) return
    const { width, height } = normalize(rect)
    if (width < 4 || height < 4) return
    setBusy(true)
    try {
      const cropped = await cropToDataUrl(dataUrl, rect)
      onConfirm(cropped)
    } finally {
      setBusy(false)
    }
  }, [dataUrl, onConfirm, rect])

  const useFull = useCallback(() => {
    onConfirm(dataUrl)
  }, [dataUrl, onConfirm])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (rect) void confirmSelection()
        else useFull()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmSelection, onCancel, rect, useFull])

  return (
    <div className="shot-region">
      <div className="shot-region__bar">
        <p className="shot-region__hint">
          在画面上拖拽选择区域；也可直接使用全图
        </p>
        <div className="shot-region__actions">
          <button type="button" className="tool-btn" disabled={busy} onClick={onCancel}>
            取消
          </button>
          <button type="button" className="tool-btn" disabled={busy} onClick={useFull}>
            使用全图
          </button>
          <button
            type="button"
            className="tool-btn tool-btn--primary"
            disabled={busy || !rect || !ready}
            onClick={() => void confirmSelection()}
          >
            确认区域
          </button>
        </div>
      </div>
      <div className="shot-region__viewport">
        <canvas
          ref={canvasRef}
          className="shot-region__canvas"
          onPointerDown={(e) => {
            if (!ready) return
            e.currentTarget.setPointerCapture(e.pointerId)
            const p = toImagePoint(e)
            draggingRef.current = true
            startRef.current = p
            setRect({ x0: p.x, y0: p.y, x1: p.x, y1: p.y })
          }}
          onPointerMove={(e) => {
            if (!draggingRef.current) return
            const p = toImagePoint(e)
            setRect({
              x0: startRef.current.x,
              y0: startRef.current.y,
              x1: p.x,
              y1: p.y
            })
          }}
          onPointerUp={() => {
            draggingRef.current = false
          }}
          onDoubleClick={() => {
            if (rect) void confirmSelection()
          }}
        />
      </div>
    </div>
  )
}
