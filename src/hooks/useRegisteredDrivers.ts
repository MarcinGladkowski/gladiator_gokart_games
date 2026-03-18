import { useState, useEffect } from 'react'
import { parseCsv } from '../components/GoogleSheetTable'

export function useRegisteredDrivers(
  csvUrl: string,
  refreshKey: number,
): string[] | null {
  const [drivers, setDrivers] = useState<string[] | null>(null)

  useEffect(() => {
    fetch(csvUrl)
      .then((r) => r.text())
      .then((text) => {
        const [header, ...rows] = parseCsv(text)
        const col = header.indexOf('Zawodnik')
        if (col === -1) {
          return
        }
        setDrivers(rows.map((r) => r[col]).filter(Boolean))
      })
      .catch(console.error)
  }, [csvUrl, refreshKey])

  return drivers
}
