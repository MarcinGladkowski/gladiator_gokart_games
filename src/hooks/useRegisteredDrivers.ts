import { useState, useEffect } from 'react'
import type { Registration } from '../types'

export function useRegisteredDrivers(
  url: string,
  refreshKey: number,
): Registration[] | null {
  const [registrations, setRegistrations] = useState<Registration[] | null>(null)

  useEffect(() => {
    fetch(url)
      .then((r) => r.json() as Promise<Record<string, string>[]>)
      .then((rows) => {
        const seen = new Set<string>()
        const parsed: Registration[] = rows
          .filter((r) => r['Zawodnik']?.trim())
          .map((r) => ({
            nickname: r['Zawodnik'].trim().toUpperCase(),
            originalNickname: r['Zawodnik'].trim(),
            registrationDateTime: new Date(r['Sygnatura czasowa'] ?? ''),
          }))
          .filter((r) => !seen.has(r.nickname) && seen.add(r.nickname) !== undefined)
        setRegistrations(parsed)
      })
      .catch(console.error)
  }, [url, refreshKey])

  return registrations
}
