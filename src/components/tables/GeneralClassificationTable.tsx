import { useMemo } from 'react'
import type { ClassificationEntry } from '../../types'
import { DriverFilter } from '../filters/DriverFilter'
import { useDriverFilter } from '../../hooks/useDriverFilter'

interface Props {
  entries: ClassificationEntry[]
}

const PODIUM = ['text-yellow-400', 'text-gray-300', 'text-orange-400']

export function GeneralClassificationTable({ entries }: Props) {
  const { query, setQuery, filtered } = useDriverFilter(entries)

  // Collect all (date, group) race slots in chronological order
  const raceSlots = useMemo(() => {
    const seen = new Set<string>()
    const slots: Array<{ date: string; group: string; label: string }> = []
    for (const e of entries) {
      for (const s of e.raceScores) {
        const key = `${s.date}-${s.group}`
        if (!seen.has(key)) {
          seen.add(key)
          const [yyyy, mm, dd] = s.date.split('-')
          slots.push({ date: s.date, group: s.group, label: `${dd}/${mm}/${yyyy} ${s.group.toUpperCase()}` })
        }
      }
    }
    return slots.sort((a, b) => a.date.localeCompare(b.date) || a.group.localeCompare(b.group))
  }, [entries])

  return (
    <div>
      <DriverFilter query={query} onChange={setQuery} placeholder="Filter by driver…" />
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-right">Pos</th>
              <th className="px-4 py-3 text-left">Driver</th>
              <th className="px-4 py-3 text-right">Points</th>
              <th className="px-4 py-3 text-right">Races</th>
              {raceSlots.map((slot) => (
                <th key={`${slot.date}-${slot.group}`} className="px-3 py-3 text-right whitespace-nowrap">
                  {slot.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => {
              const color = PODIUM[entry.position - 1] ?? ''
              const scoreMap = new Map(
                entry.raceScores.map((s) => [`${s.date}-${s.group}`, s]),
              )
              return (
                <tr
                  key={entry.driver}
                  className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors"
                >
                  <td className={`px-4 py-3 text-right font-bold ${color}`}>{entry.position}</td>
                  <td className={`px-4 py-3 font-medium ${color}`}>{entry.driver}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-bold">{entry.totalPoints}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{entry.racesCount}</td>
                  {raceSlots.map((slot) => {
                    const key = `${slot.date}-${slot.group}`
                    const score = scoreMap.get(key)
                    if (!score) {
                      return (
                        <td key={key} className="px-3 py-3 text-right text-gray-600">
                          —
                        </td>
                      )
                    }
                    return (
                      <td
                        key={key}
                        className={`px-3 py-3 text-right ${
                          score.counted
                            ? 'text-white font-semibold'
                            : 'text-gray-500 line-through'
                        }`}
                        title={score.counted ? 'Counted in best 6' : 'Not counted (best 6 rule)'}
                      >
                        {score.points}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Points in bold count toward the total (best {6} races per driver). Strikethrough scores are excluded.
      </p>
    </div>
  )
}
