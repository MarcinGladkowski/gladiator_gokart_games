import { useState, useEffect } from 'react'
import { parseCsv } from '../components/GoogleSheetTable'
import type { Registration } from '../types'

export function useRegisteredDrivers(
  csvUrl: string,
  refreshKey: number,
): Registration[] | null {
  const [registrations, setRegistrations] = useState<Registration[] | null>(null)

  useEffect(() => {
    fetch(csvUrl)
      .then((r) => r.text())
      .then((text) => {
        const [header, ...rows] = parseCsv(text)
        const nicknameCol = header.indexOf('Zawodnik')
        const timestampCol = header.indexOf('Sygnatura czasowa')
        if (nicknameCol === -1) return

        const parsed: Registration[] = rows
          .filter((r) => r[nicknameCol]?.trim())
          .map((r) => ({
            nickname: r[nicknameCol].trim().toUpperCase(),
            originalNickname: r[nicknameCol].trim(),
            registrationDateTime: new Date(r[timestampCol] ?? ''),
          }))

        setRegistrations(parsed)
      })
      .catch(console.error)
  }, [csvUrl, refreshKey])

  return registrations
}
