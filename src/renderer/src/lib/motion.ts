import type { Transition, Variants } from 'framer-motion'

export const easeOutSoft = [0.22, 1, 0.36, 1] as const

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
  mass: 0.8
}

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 28
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeOutSoft }
  }
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: easeOutSoft } }
}

export const staggerGrid: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.045, delayChildren: 0.04 }
  }
}

export const cardItem: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: easeOutSoft }
  }
}

export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOutSoft }
  }
}

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
}

export const modalPanel: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springSoft
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.98,
    transition: { duration: 0.16, ease: easeOutSoft }
  }
}

export const toastMotion: Variants = {
  hidden: { opacity: 0, y: 16, x: '-50%', scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    x: '-50%',
    scale: 1,
    transition: springSnappy
  },
  exit: {
    opacity: 0,
    y: 10,
    x: '-50%',
    scale: 0.98,
    transition: { duration: 0.18 }
  }
}
