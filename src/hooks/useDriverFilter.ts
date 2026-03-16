import { useState, useMemo } from 'react'

export function useDriverFilter<T extends { driver?: string; nickname?: string }>(
  entries: T[],
) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => {
      const name = (e.driver ?? e.nickname ?? '').toLowerCase()
      return name.includes(q)
    })
  }, [entries, query])

  return { query, setQuery, filtered }
}
