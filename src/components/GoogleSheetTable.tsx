import { useEffect, useState } from 'react'

interface Props {
  csvUrl: string
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    if (!line.trim()) continue
    const cells: string[] = []
    let inQuotes = false
    let cell = ''
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(cell)
        cell = ''
      } else {
        cell += ch
      }
    }
    cells.push(cell)
    rows.push(cells)
  }
  return rows
}

export function GoogleSheetTable({ csvUrl }: Props) {
  const [rows, setRows] = useState<string[][] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(csvUrl, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then((text) => setRows(parseCsv(text)))
      .catch((err) => {
        console.error('GoogleSheetTable fetch error:', err)
        setError(true)
      })
  }, [csvUrl])

  if (error) {
    return <p className="text-red-400 text-sm">Failed to load registrations.</p>
  }

  if (!rows) {
    return <p className="text-gray-500 text-sm">Loading registrations…</p>
  }

  const [header, ...data] = rows

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
          <tr>
            <th className="px-4 py-3 text-right">#</th>
            {header?.map((col, i) => (
              <th key={i} className="px-4 py-3 text-left whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors">
              <td className="px-4 py-3 text-right text-gray-600">{i + 1}</td>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-gray-300 whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <p className="px-4 py-6 text-center text-gray-500 text-sm">No registrations yet.</p>
      )}
    </div>
  )
}
