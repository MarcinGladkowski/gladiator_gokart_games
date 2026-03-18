import { useState, useEffect } from 'react'
import { parseCsv } from '../components/GoogleSheetTable'

type SortFn = (a: string, b: string) => number

export function sortAlphabetically(a: string, b: string): number {
  return a.localeCompare(b, 'pl')
}

export function useRegisteredDrivers(
  csvUrl: string,
  refreshKey: number,
  sortFns: SortFn[] = [sortAlphabetically],
): string[] | null {
  const [drivers, setDrivers] = useState<string[] | null>(null)

  useEffect(() => {
    fetch(csvUrl)
      .then((r) => r.text())
      .then((text) => {
        const [header, ...rows] = parseCsv(text)
        const col = header.indexOf('Zawodnik')
        if (col === -1) return
        const names = rows.map((r) => r[col]).filter(Boolean)
        names.sort((a, b) => {
          for (const fn of sortFns) {
            const result = fn(a, b)
            if (result !== 0) return result
          }
          return 0
        })
        setDrivers(names)
      })
      .catch(console.error)
  }, [csvUrl, refreshKey])

  return drivers
}
