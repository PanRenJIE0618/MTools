import { useCallback, useEffect, useState } from 'react'
import type { Tool } from '../../../shared/tool'
import { builtinTools } from '../registry/builtinTools'
import { mergeTools } from '../registry/mergeTools'

export function useTools() {
  const [tools, setTools] = useState<Tool[]>(() => mergeTools(builtinTools, []))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const external = await window.mtools.listExternal()
      setTools(mergeTools(builtinTools, external))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const saveExternals = useCallback(
    async (nextExternals: Tool[]) => {
      setError(null)
      try {
        const toSave = nextExternals.filter((t) => !t.builtin)
        await window.mtools.saveExternal(toSave)
        await reload()
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        throw err
      }
    },
    [reload]
  )

  const launch = useCallback(
    (tool: Pick<Tool, 'kind' | 'target' | 'args'>) => window.mtools.launch(tool),
    []
  )

  return { tools, loading, reload, saveExternals, launch, error }
}
