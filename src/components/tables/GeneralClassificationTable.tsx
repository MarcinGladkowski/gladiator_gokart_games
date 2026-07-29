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

  // Collect all race dates in chronological order
  const raceSlots = useMemo(() => {
    const seen = new Set<string>()
    const slots: Array<{ date: string; label: string }> = []
    for (const e of entries) {
      for (const s of e.raceScores) {
        if (!seen.has(s.date)) {
          seen.add(s.date)
          const [yyyy, mm, dd] = s.date.split('-')
          slots.push({ date: s.date, label: `${dd}/${mm}/${yyyy}` })
        }
      }
    }
    return slots.sort((a, b) => a.date.localeCompare(b.date))
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
                <th key={slot.date} className="px-3 py-3 text-right whitespace-nowrap">
                  {slot.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => {
              const color = PODIUM[entry.position - 1] ?? ''
              const scoresByDate = new Map<string, typeof entry.raceScores>()
              for (const s of entry.raceScores) {
                const existing = scoresByDate.get(s.date)
                if (existing) {
                  existing.push(s)
                } else {
                  scoresByDate.set(s.date, [s])
                }
              }
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
                    const scores = scoresByDate.get(slot.date)
                    if (!scores || scores.length === 0) {
                      return (
                        <td key={slot.date} className="px-3 py-3 text-right text-gray-600">
                          —
                        </td>
                      )
                    }
                    return (
                      <td key={slot.date} className="px-3 py-3 text-right">
                        {[...scores]
                          .sort((a, b) => a.group.localeCompare(b.group))
                          .map((score) => {
                            const bonus = score.group === 'a' ? 2 : 1
                            return (
                              <div
                                key={score.group}
                                className={`whitespace-nowrap ${
                                  score.counted
                                    ? 'text-white font-semibold'
                                    : 'text-gray-500 line-through'
                                }`}
                                title={
                                  score.fastestLap
                                    ? `Group ${score.group.toUpperCase()} · Fastest lap +${bonus}pt${score.counted ? ' · Counted in best 6' : ' · Not counted (best 6 rule)'}`
                                    : `Group ${score.group.toUpperCase()} · ${score.counted ? 'Counted in best 6' : 'Not counted (best 6 rule)'}`
                                }
                              >
                                {score.fastestLap && <span className="mr-1 text-purple-400 text-xs">⚡</span>}
                                {score.group.toUpperCase()} · {score.points}
                              </div>
                            )
                          })}
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
        {' '}<span className="text-purple-400">⚡</span> = fastest lap bonus (+2 pts in group A, +1 pt in group B).
      </p>
    </div>
  )
}
