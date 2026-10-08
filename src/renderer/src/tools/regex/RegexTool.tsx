import { useMemo, useState } from 'react'

type MatchRow = { index: number; match: string; groups: string[] }

function buildFlags(global: boolean, ignoreCase: boolean, multiline: boolean): string {
  let flags = ''
  if (global) flags += 'g'
  if (ignoreCase) flags += 'i'
  if (multiline) flags += 'm'
  return flags
}

function collectMatches(text: string, re: RegExp): MatchRow[] {
  const rows: MatchRow[] = []
  for (const m of text.matchAll(re)) {
    rows.push({
      index: m.index ?? 0,
      match: m[0],
      groups: m.slice(1)
    })
  }
  return rows
}

function HighlightPreview({
  text,
  re
}: {
  text: string
  re: RegExp | null
}): React.JSX.Element {
  const nodes = useMemo(() => {
    if (!re || !text) return [text]
    const globalRe = re.global ? re : new RegExp(re.source, `${re.flags}g`)
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let key = 0
    for (const m of text.matchAll(globalRe)) {
      const start = m.index ?? 0
      if (start > lastIndex) {
        parts.push(text.slice(lastIndex, start))
      }
      parts.push(
        <mark key={key++} className="regex-highlight">
          {m[0]}
        </mark>
      )
      lastIndex = start + m[0].length
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }
    return parts.length ? parts : [text]
  }, [text, re])

  return <pre className="regex-preview">{nodes}</pre>
}

export default function RegexTool(): React.JSX.Element {
  const [pattern, setPattern] = useState('')
  const [flagGlobal, setFlagGlobal] = useState(true)
  const [flagIgnoreCase, setFlagIgnoreCase] = useState(false)
  const [flagMultiline, setFlagMultiline] = useState(false)
  const [testText, setTestText] = useState('')

  const flags = buildFlags(flagGlobal, flagIgnoreCase, flagMultiline)

  const { re, error, matches } = useMemo(() => {
    if (!pattern) {
      return { re: null as RegExp | null, error: '', matches: [] as MatchRow[] }
    }
    try {
      const compiled = new RegExp(pattern, flags)
      const list =
        testText && compiled.global ? collectMatches(testText, compiled) : []
      return { re: compiled, error: '', matches: list }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '无效的正则表达式'
      return { re: null, error: msg, matches: [] as MatchRow[] }
    }
  }, [pattern, flags, testText])

  return (
    <div className="tool-panel">
      <label className="tool-field">
        <span className="tool-field__label">正则表达式</span>
        <input
          className="tool-input"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="输入模式…"
          spellCheck={false}
        />
      </label>
      <fieldset className="regex-flags">
        <legend className="tool-field__label">标志</legend>
        <label className="regex-flag">
          <input
            type="checkbox"
            checked={flagGlobal}
            onChange={(e) => setFlagGlobal(e.target.checked)}
          />
          全局 (g)
        </label>
        <label className="regex-flag">
          <input
            type="checkbox"
            checked={flagIgnoreCase}
            onChange={(e) => setFlagIgnoreCase(e.target.checked)}
          />
          忽略大小写 (i)
        </label>
        <label className="regex-flag">
          <input
            type="checkbox"
            checked={flagMultiline}
            onChange={(e) => setFlagMultiline(e.target.checked)}
          />
          多行 (m)
        </label>
      </fieldset>
      {error ? <p className="tool-error">{error}</p> : null}
      <label className="tool-field">
        <span className="tool-field__label">测试文本</span>
        <textarea
          className="tool-textarea"
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="输入待匹配的文本…"
          rows={8}
        />
      </label>
      <label className="tool-field">
        <span className="tool-field__label">高亮预览</span>
        <HighlightPreview text={testText} re={error ? null : re} />
      </label>
      <label className="tool-field">
        <span className="tool-field__label">
          匹配结果{matches.length ? `（${matches.length}）` : ''}
        </span>
        {!pattern ? (
          <p className="diff-result__empty">输入正则表达式以查看匹配</p>
        ) : error ? null : !flagGlobal ? (
          <p className="diff-result__empty">勾选「全局 (g)」以列出全部匹配</p>
        ) : matches.length === 0 ? (
          <p className="diff-result__empty">无匹配</p>
        ) : (
          <ul className="regex-matches">
            {matches.map((row, idx) => (
              <li key={idx} className="regex-match">
                <span className="regex-match__index">@{row.index}</span>
                <code className="regex-match__text">{row.match}</code>
                {row.groups.length > 0 ? (
                  <span className="regex-match__groups">
                    分组: {row.groups.map((g, i) => (g != null ? `[${i + 1}]=${g}` : `[${i + 1}]=`)).join(' ')}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </label>
    </div>
  )
}
