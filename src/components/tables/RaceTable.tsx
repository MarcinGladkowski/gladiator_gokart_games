import type { RaceEntry } from '../../types'
import { DriverFilter } from '../filters/DriverFilter'
import { useDriverFilter } from '../../hooks/useDriverFilter'
import { parseLapTimeToMs } from '../../hooks/useResults'
import { DriverLink } from '../links/DriverLink'
import { positionsGained } from '../../services/startingGrid'

const PODIUM = ['text-yellow-400', 'text-gray-300', 'text-orange-400']

interface Props {
  entries: RaceEntry[]
  // Lowercased driver name → start position; enables the gained/lost positions column
  startPositions?: Map<string, number>
}

function PositionChange({ change }: { change: number }) {
  if (change > 0) {
    return <span className="text-green-400" title={`Gained ${change} position${change === 1 ? '' : 's'}`}>▲{change}</span>
  }
  if (change < 0) {
    return <span className="text-red-500" title={`Lost ${-change} position${change === -1 ? '' : 's'}`}>▼{-change}</span>
  }
  return <span className="text-gray-600" title="Held start position">–</span>
}

export function RaceTable({ entries, startPositions }: Props) {
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
              {startPositions && <th className="px-4 py-3 text-right">Start</th>}
              {startPositions && <th className="px-4 py-3 text-right">+/-</th>}
              <th className="px-4 py-3 text-right">Kart</th>
              <th className="px-4 py-3 text-left">Driver</th>
              <th className="px-4 py-3 text-right">Gap</th>
              <th className="px-4 py-3 text-right">Best Lap</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, idx) => {
              const color = PODIUM[entry.position - 1] ?? ''
              const isFastest = entry.driver === fastestDriver
              const startPosition = startPositions?.get(entry.driver.toLowerCase())
              return (
                <tr
                  key={idx}
                  className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors"
                >
                  <td className={`px-4 py-3 text-right font-bold ${color}`}>{entry.position}</td>
                  {startPositions && <td className="px-4 py-3 text-right text-gray-400">{startPosition ?? '—'}</td>}
                  {startPositions && (
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {startPosition === undefined
                        ? <span className="text-gray-600">—</span>
                        : <PositionChange change={positionsGained(startPosition, entry.position)} />}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right text-gray-400">{entry.kartNumber}</td>
                  <td className={`px-4 py-3 font-medium uppercase ${color}`}><DriverLink name={entry.driver} /></td>
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
