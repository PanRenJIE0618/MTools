import { createContext, useContext, useState, type ReactNode } from 'react'
import type { ToolCategory } from '../../../shared/tool'

export type CategoryFilter = 'all' | ToolCategory

type CategoryContextValue = {
  category: CategoryFilter
  setCategory: (category: CategoryFilter) => void
}

const CategoryContext = createContext<CategoryContextValue | null>(null)

export function CategoryProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [category, setCategory] = useState<CategoryFilter>('all')
  return (
    <CategoryContext.Provider value={{ category, setCategory }}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategoryFilter(): CategoryContextValue {
  const ctx = useContext(CategoryContext)
  if (!ctx) {
    throw new Error('useCategoryFilter must be used within CategoryProvider')
  }
  return ctx
}
