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
        const parsed: Registration[] = rows
          .filter((r) => r['Zawodnik']?.trim())
          .map((r) => ({
            nickname: r['Zawodnik'].trim().toUpperCase(),
            originalNickname: r['Zawodnik'].trim(),
            registrationDateTime: new Date(r['Sygnatura czasowa'] ?? ''),
          }))
        setRegistrations(parsed)
      })
      .catch(console.error)
  }, [url, refreshKey])

  return registrations
}
