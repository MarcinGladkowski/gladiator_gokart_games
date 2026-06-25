import type { RaceEntry } from '../../types'
import { DriverFilter } from '../filters/DriverFilter'
import { useDriverFilter } from '../../hooks/useDriverFilter'
import { parseLapTimeToMs } from '../../hooks/useResults'

const PODIUM = ['text-yellow-400', 'text-gray-300', 'text-orange-400']

interface Props {
  entries: RaceEntry[]
}

export function RaceTable({ entries }: Props) {
  const { query, setQuery, filtered } = useDriverFilter(entries)

  const fastestDriver = entries.reduce<{ driver: string; ms: number } | null>((best, entry) => {
    const ms = parseLapTimeToMs(entry.bestLap)
    return best === null || ms < best.ms ? { driver: entry.driver, ms } : best
  }, null)?.driver ?? null

  return (
    <div>
      <DriverFilter query={query} onChange={setQuery} />
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-right">Pos</th>
              <th className="px-4 py-3 text-right">Kart</th>
              <th className="px-4 py-3 text-left">Driver</th>
              <th className="px-4 py-3 text-right">Laps</th>
              <th className="px-4 py-3 text-right">Gap</th>
              <th className="px-4 py-3 text-right">Best Lap</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, idx) => {
              const color = PODIUM[entry.position - 1] ?? ''
              const isFastest = entry.driver === fastestDriver
              return (
                <tr
                  key={idx}
                  className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors"
                >
                  <td className={`px-4 py-3 text-right font-bold ${color}`}>{entry.position}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{entry.kartNumber}</td>
                  <td className={`px-4 py-3 font-medium ${color}`}>{entry.driver}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{entry.laps}</td>
                  <td className="px-4 py-3 text-right text-gray-400 font-mono">{entry.gap ?? '—'}</td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${isFastest ? 'text-purple-400' : 'text-green-400'}`}>
                    {entry.bestLap}
                    {isFastest && <span className="ml-1 text-xs">⚡</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
