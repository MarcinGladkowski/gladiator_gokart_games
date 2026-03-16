import { useState, useMemo } from 'react'
import type { TotalResultEntry } from '../../types'
import { DriverFilter } from '../filters/DriverFilter'
import { useDriverFilter } from '../../hooks/useDriverFilter'

type SortKey = 'position' | 'nickname' | 'scorePercent' | 'racesCount'
type SortDir = 'asc' | 'desc'

interface Props {
  entries: TotalResultEntry[]
}

export function TotalResultsTable({ entries }: Props) {
  const { query, setQuery, filtered } = useDriverFilter(entries)
  const [sortKey, setSortKey] = useState<SortKey>('position')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const raceDates = useMemo(() => {
    const dates = new Set<string>()
    for (const e of entries) {
      Object.keys(e.raceScores).forEach((d) => dates.add(d))
    }
    return [...dates].sort()
  }, [entries])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'position') cmp = a.position - b.position
      else if (sortKey === 'nickname') cmp = a.nickname.localeCompare(b.nickname)
      else if (sortKey === 'scorePercent') cmp = a.scorePercent - b.scorePercent
      else if (sortKey === 'racesCount') cmp = a.racesCount - b.racesCount
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="ml-1 text-gray-600">↕</span>
    return <span className="ml-1 text-red-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const PODIUM = ['text-yellow-400', 'text-gray-300', 'text-orange-400']

  return (
    <div>
      <DriverFilter query={query} onChange={setQuery} placeholder="Filter by nickname…" />
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-gray-200 select-none"
                onClick={() => toggleSort('position')}
              >
                Pos<SortIcon col="position" />
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:text-gray-200 select-none"
                onClick={() => toggleSort('nickname')}
              >
                Nickname<SortIcon col="nickname" />
              </th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-gray-200 select-none"
                onClick={() => toggleSort('scorePercent')}
              >
                Score%<SortIcon col="scorePercent" />
              </th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-gray-200 select-none"
                onClick={() => toggleSort('racesCount')}
              >
                Races<SortIcon col="racesCount" />
              </th>
              {raceDates.map((d) => (
                <th key={d} className="px-4 py-3 text-right whitespace-nowrap">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, idx) => {
              const color = PODIUM[entry.position - 1] ?? ''
              return (
                <tr
                  key={idx}
                  className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors"
                >
                  <td className={`px-4 py-3 text-right font-bold ${color}`}>{entry.position}</td>
                  <td className={`px-4 py-3 font-medium ${color}`}>{entry.nickname}</td>
                  <td className="px-4 py-3 text-right text-green-400">{entry.scorePercent.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right text-gray-300">{entry.racesCount}</td>
                  {raceDates.map((d) => {
                    const score = entry.raceScores[d]
                    return (
                      <td key={d} className="px-4 py-3 text-right text-gray-400">
                        {score != null ? score.toFixed(1) : '—'}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
