import { useParams, Link } from 'react-router-dom'
import { useRaceEvent } from '../hooks/useResults'
import { buildStartingGrid, type StartingGridSlot } from '../services/startingGrid'
import { DriverFilter } from '../components/filters/DriverFilter'
import { useDriverFilter } from '../hooks/useDriverFilter'
import { DriverLink } from '../components/links/DriverLink'

const PODIUM = ['text-yellow-400', 'text-gray-300', 'text-orange-400']

function StartingGridTable({ slots }: { slots: StartingGridSlot[] }) {
  const { query, setQuery, filtered } = useDriverFilter(slots)

  return (
    <div>
      <DriverFilter query={query} onChange={setQuery} />
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-right">Start</th>
              <th className="px-4 py-3 text-left">Driver</th>
              <th className="px-4 py-3 text-right">Best Lap</th>
              <th className="px-4 py-3 text-right">Qualifications</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((slot) => {
              const color = PODIUM[slot.position - 1] ?? ''
              return (
                <tr
                  key={slot.driver}
                  className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors"
                >
                  <td className={`px-4 py-3 text-right font-bold ${color}`}>{slot.position}</td>
                  <td className={`px-4 py-3 font-medium uppercase ${color}`}><DriverLink name={slot.driver} /></td>
                  <td className="px-4 py-3 text-right font-mono text-green-400">{slot.bestLap || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-400">
                    Group {slot.qualiGroup.toUpperCase()} · P{slot.qualiPosition}
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

export function StartingGridPage() {
  const { year, date } = useParams<{ year: string; date: string }>()
  const event = useRaceEvent(Number(year), date ?? '')
  const grid = event ? buildStartingGrid(event.sessions) : null

  if (!event || !grid) {
    return <p className="text-gray-500">Starting grid not available.</p>
  }

  return (
    <div>
      <div className="mb-2 text-sm text-gray-500">
        <Link to={`/season/${year}`} className="hover:text-red-400">
          {year}
        </Link>
        {' / '}
        <Link to={`/season/${year}/${date}`} className="hover:text-red-400">
          {date}
        </Link>
        {' / '}
        <span className="text-gray-300">Starting Grid</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Starting Grid</h1>
      <p className="text-sm text-gray-500 mb-6">
        Drivers from both qualifying groups ranked by best lap — the fastest {grid.a.length} start race A, the rest start race B.
      </p>

      <div className="space-y-10">
        {([['A', grid.a], ['B', grid.b]] as const)
          .filter(([, slots]) => slots.length > 0)
          .map(([group, slots]) => (
            <div key={group}>
              <h2 className="text-lg font-semibold text-gray-100 mb-3">Race Group {group}</h2>
              <StartingGridTable slots={slots} />
            </div>
          ))}
      </div>
    </div>
  )
}
