import { useEffect, useState } from 'react'

interface Props {
  url: string
  rowFilter?: (row: Record<string, string>) => boolean
  formatters?: Record<string, (value: string) => string>
  rowClassName?: (row: Record<string, string>) => string
}

export function GoogleSheetTable({ url, rowFilter, formatters, rowClassName }: Props) {
  const [rows, setRows] = useState<Record<string, string>[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<Record<string, string>[]>
      })
      .then((data) => setRows(rowFilter ? data.filter(rowFilter) : data))
      .catch((err) => {
        console.error('GoogleSheetTable fetch error:', err)
        setError(true)
      })
  }, [url])

  if (error) {
    return <p className="text-red-400 text-sm">Failed to load registrations.</p>
  }

  if (!rows) {
    return <p className="text-gray-500 text-sm">Loading registrations…</p>
  }

  const VISIBLE_COLUMNS = ['Sygnatura czasowa', 'Zawodnik']
  const headers = rows.length > 0 ? Object.keys(rows[0]).filter((col) => VISIBLE_COLUMNS.includes(col)) : []

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
          <tr>
            <th className="px-4 py-3 text-right">#</th>
            {headers.map((col) => (
              <th key={col} className="px-4 py-3 text-left whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-t border-gray-700 hover:bg-gray-800/50 transition-colors ${rowClassName?.(row) ?? ''}`}>
              <td className="px-4 py-3 text-right text-gray-600">{i + 1}</td>
              {headers.map((col) => (
                <td key={col} className="px-4 py-3 text-gray-300 whitespace-nowrap">
                  {formatters?.[col] ? formatters[col](row[col]) : row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="px-4 py-6 text-center text-gray-500 text-sm">No registrations yet.</p>
      )}
    </div>
  )
}
