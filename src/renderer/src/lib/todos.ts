export type Todo = {
  id: string
  text: string
  done: boolean
  /** YYYY-MM-DD，创建时自动写入 */
  createdAt: string
  /** YYYY-MM-DD，可选截止日期 */
  endDate?: string
}

export function todayIso(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function normalizeTodo(raw: unknown): Todo | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.text !== 'string') return null

  let createdAt = typeof o.createdAt === 'string' ? o.createdAt : ''
  if (!createdAt) {
    const m = /^t-(\d+)$/.exec(o.id)
    if (m) {
      const d = new Date(Number(m[1]))
      if (!Number.isNaN(d.getTime())) {
        const p = (n: number) => String(n).padStart(2, '0')
        createdAt = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
      }
    }
  }
  if (!createdAt && typeof o.startDate === 'string') {
    createdAt = o.startDate
  }
  if (!createdAt) createdAt = todayIso()

  return {
    id: o.id,
    text: o.text,
    done: Boolean(o.done),
    createdAt,
    endDate: typeof o.endDate === 'string' ? o.endDate : undefined
  }
}

/** 待办是否归属某日：创建日 / 结束日 / 区间内 */
export function todoOnDate(todo: Todo, dateIso: string): boolean {
  if (todo.createdAt === dateIso || todo.endDate === dateIso) return true
  if (todo.endDate && todo.createdAt <= dateIso && dateIso <= todo.endDate) {
    return true
  }
  return false
}

export async function loadTodos(): Promise<Todo[]> {
  const data = await window.mtools.storeGet('todos')
  if (!Array.isArray(data)) return []
  return data.map(normalizeTodo).filter((x): x is Todo => Boolean(x))
}

export async function saveTodos(items: Todo[]): Promise<void> {
  await window.mtools.storeSet('todos', items)
}

export function createTodo(text: string, dateIso: string): Todo {
  return {
    id: `t-${Date.now()}`,
    text: text.trim(),
    done: false,
    createdAt: dateIso,
    endDate: dateIso
  }
}
