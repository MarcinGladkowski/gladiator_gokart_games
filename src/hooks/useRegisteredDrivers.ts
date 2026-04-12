import { useState, useEffect } from 'react'
import type { Registration } from '../types'
import knownDrivers from '../data/drivers.json'

interface UseRegisteredDriversResult {
  registrations: Registration[] | null
  rawRows: Record<string, string>[] | null
}

export function useRegisteredDrivers(
  url: string | null,
  refreshKey: number,
): UseRegisteredDriversResult {
  const [registrations, setRegistrations] = useState<Registration[] | null>(null)
  const [rawRows, setRawRows] = useState<Record<string, string>[] | null>(null)

  useEffect(() => {
    if (!url) return
    fetch(url)
      .then((r) => r.json() as Promise<Record<string, string>[]>)
      .then((rows) => {
        setRawRows(rows)
        const knownSet = new Set((knownDrivers as string[]).map((n) => n.toUpperCase()))
        const seen = new Set<string>()
        const parsed: Registration[] = rows
          .filter((r) => r['Zawodnik']?.trim() && knownSet.has(r['Zawodnik'].trim().toUpperCase()))
          .map((r) => ({
            nickname: r['Zawodnik'].trim().toUpperCase(),
            originalNickname: r['Zawodnik'].trim(),
            registrationDateTime: new Date(r['Sygnatura czasowa'] ?? ''),
            resignedAt: r['Wypis']?.trim() ? new Date(r['Wypis'].trim()) : undefined,
          }))
          .filter((r) => !seen.has(r.nickname) && seen.add(r.nickname) !== undefined)
        setRegistrations(parsed)
      })
      .catch(console.error)
  }, [url, refreshKey])

  return { registrations, rawRows }
}
