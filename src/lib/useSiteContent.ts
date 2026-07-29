import { useEffect, useState } from 'react'
import { listSiteContent } from './api'
import { getDefault } from './siteContent'

export function useSiteContent(): {
  c: (key: string) => string
  cList: (key: string) => string[]
  loaded: boolean
} {
  const [map, setMap] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    listSiteContent()
      .then((rows) => {
        if (!active) return
        const m: Record<string, string> = {}
        for (const r of rows) if (r.value != null) m[r.key] = r.value
        setMap(m)
      })
      .catch(() => {})
      .finally(() => active && setLoaded(true))
    return () => {
      active = false
    }
  }, [])

  const c = (key: string): string => {
    const v = map[key]
    return v != null && v.trim() !== '' ? v : getDefault(key)
  }
  const cList = (key: string): string[] =>
    c(key)
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

  return { c, cList, loaded }
}
