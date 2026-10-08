type SearchBarProps = {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps): React.JSX.Element {
  return (
    <div className="search-bar">
      <input
        className="search-bar__input"
        type="search"
        placeholder="搜索工具名称或描述…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="搜索工具"
      />
    </div>
  )
}
