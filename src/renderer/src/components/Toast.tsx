import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { toastBus } from '../lib/toastBus'
import { toastMotion } from '../lib/motion'

const DISMISS_MS = 3200

export default function Toast(): React.JSX.Element {
  const [message, setMessage] = useState<string | null>(null)
  const reduceMotion = useReducedMotion()

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

  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          className="toast"
          role="status"
          variants={toastMotion}
          initial={reduceMotion ? false : 'hidden'}
          animate="show"
          exit="exit"
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
