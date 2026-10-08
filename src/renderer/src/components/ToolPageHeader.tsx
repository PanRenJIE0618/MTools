import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { fadeUp } from '../lib/motion'

type ToolPageHeaderProps = {
  title: string
  description: string
}

export default function ToolPageHeader({
  title,
  description
}: ToolPageHeaderProps): React.JSX.Element {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  return (
    <motion.header
      className="tool-page-header"
      variants={fadeUp}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <button
        type="button"
        className="tool-page-header__back"
        onClick={() => navigate('/')}
      >
        ← 返回
      </button>
      <h1 className="tool-page-header__title">{title}</h1>
      <p className="tool-page-header__desc">{description}</p>
    </motion.header>
  )
}
