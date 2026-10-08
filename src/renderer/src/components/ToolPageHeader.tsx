import { useNavigate } from 'react-router-dom'

type ToolPageHeaderProps = {
  title: string
  description: string
}

export default function ToolPageHeader({
  title,
  description
}: ToolPageHeaderProps): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <header className="tool-page-header">
      <button
        type="button"
        className="tool-page-header__back"
        onClick={() => navigate('/')}
      >
        ← 返回
      </button>
      <h1 className="tool-page-header__title">{title}</h1>
      <p className="tool-page-header__desc">{description}</p>
    </header>
  )
}
