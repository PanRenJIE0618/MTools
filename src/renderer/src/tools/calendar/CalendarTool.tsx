import { useCallback, useEffect, useMemo, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatDateTime(d: Date): string {
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function buildCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const startWeekday = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function CalendarTool(): React.JSX.Element {
  const [now, setNow] = useState(() => new Date())
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [selected, setSelected] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const cells = useMemo(
    () => buildCells(cursor.year, cursor.month),
    [cursor.month, cursor.year]
  )

  const shiftMonth = useCallback((delta: number) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }, [])

  const goToday = useCallback(() => {
    const d = new Date()
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
    setSelected(d)
  }, [])

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toastBus.show('已复制')
    } catch {
      toastBus.show('复制失败')
    }
  }, [])

  const weekOfYear = useMemo(() => {
    const d = new Date(selected)
    d.setHours(0, 0, 0, 0)
    const oneJan = new Date(d.getFullYear(), 0, 1)
    const dayMs = 86400000
    return Math.ceil(((d.getTime() - oneJan.getTime()) / dayMs + oneJan.getDay() + 1) / 7)
  }, [selected])

  const dayOfYear = useMemo(() => {
    const start = new Date(selected.getFullYear(), 0, 0)
    return Math.floor((selected.getTime() - start.getTime()) / 86400000)
  }, [selected])

  return (
    <div className="tool-panel cal-layout">
      <div className="cal-now">
        <div className="cal-now__time">{formatDateTime(now)}</div>
        <div className="cal-now__meta">
          本地时区 · Unix {Math.floor(now.getTime() / 1000)}
        </div>
        <div className="tool-actions">
          <button
            type="button"
            className="tool-btn"
            onClick={() => void copyText(formatDateTime(now))}
          >
            复制当前时间
          </button>
          <button
            type="button"
            className="tool-btn"
            onClick={() => void copyText(String(Math.floor(now.getTime() / 1000)))}
          >
            复制时间戳
          </button>
        </div>
      </div>

      <div className="cal-panel">
        <div className="cal-toolbar">
          <button type="button" className="tool-btn" onClick={() => shiftMonth(-1)}>
            上月
          </button>
          <div className="cal-toolbar__title">
            {cursor.year} 年 {cursor.month + 1} 月
          </div>
          <button type="button" className="tool-btn" onClick={() => shiftMonth(1)}>
            下月
          </button>
          <button type="button" className="tool-btn tool-btn--primary" onClick={goToday}>
            今天
          </button>
        </div>

        <div className="cal-grid" role="grid" aria-label="月历">
          {WEEKDAYS.map((w) => (
            <div key={w} className="cal-grid__head">
              {w}
            </div>
          ))}
          {cells.map((day, i) => {
            if (!day) {
              return <div key={`e-${i}`} className="cal-grid__cell cal-grid__cell--empty" />
            }
            const isToday = sameDay(day, now)
            const isSelected = sameDay(day, selected)
            return (
              <button
                key={day.toISOString()}
                type="button"
                className={[
                  'cal-grid__cell',
                  isToday ? 'cal-grid__cell--today' : '',
                  isSelected ? 'cal-grid__cell--selected' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setSelected(day)}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>
      </div>

      <div className="cal-detail">
        <h3 className="cal-detail__title">选中日期</h3>
        <dl className="cal-detail__list">
          <div>
            <dt>日期</dt>
            <dd>{formatDate(selected)}</dd>
          </div>
          <div>
            <dt>星期</dt>
            <dd>星期{WEEKDAYS[selected.getDay()]}</dd>
          </div>
          <div>
            <dt>今年第几天</dt>
            <dd>{dayOfYear}</dd>
          </div>
          <div>
            <dt>今年第几周</dt>
            <dd>{weekOfYear}</dd>
          </div>
          <div>
            <dt>时间戳（0 点）</dt>
            <dd>
              {Math.floor(
                new Date(
                  selected.getFullYear(),
                  selected.getMonth(),
                  selected.getDate()
                ).getTime() / 1000
              )}
            </dd>
          </div>
        </dl>
        <div className="tool-actions">
          <button
            type="button"
            className="tool-btn tool-btn--primary"
            onClick={() => void copyText(formatDate(selected))}
          >
            复制日期
          </button>
          <button
            type="button"
            className="tool-btn"
            onClick={() =>
              void copyText(
                String(
                  Math.floor(
                    new Date(
                      selected.getFullYear(),
                      selected.getMonth(),
                      selected.getDate()
                    ).getTime() / 1000
                  )
                )
              )
            }
          >
            复制当日时间戳
          </button>
        </div>
      </div>
    </div>
  )
}
