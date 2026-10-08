import { useEffect, useState } from 'react'
import { toastBus } from '../lib/toastBus'

const DISMISS_MS = 3200

export default function Toast(): React.JSX.Element | null {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    return toastBus.subscribe((msg) => {
      setMessage(msg)
    })
  }, [])

  useEffect(() => {
    if (!message) return
    const id = window.setTimeout(() => setMessage(null), DISMISS_MS)
    return () => window.clearTimeout(id)
  }, [message])

  if (!message) return null
  return (
    <div className="toast" role="status">
      {message}
    </div>
  )
}
