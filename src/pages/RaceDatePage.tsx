import { useParams, Link } from 'react-router-dom'
import { useRaceEvent } from '../hooks/useResults'

export function RaceDatePage() {
  const { year, date } = useParams<{ year: string; date: string }>()
  const event = useRaceEvent(Number(year), date ?? '')

  if (!event) {
    return <p className="text-gray-500">Event {date} not found.</p>
  }

  return (
    <div>
      <div className="mb-2 text-sm text-gray-500">
        <Link to={`/season/${year}`} className="hover:text-red-400">
          {year}
        </Link>
        {' / '}
        <span className="text-gray-300">{event.label}</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-6">{event.label}</h1>
      {event.upcoming ? (
        <p className="text-gray-500">Race not yet available.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {event.sessions.map((session) => {
            const label = `${session.type === 'qualifications' ? 'Qualifications' : 'Race'} ${session.group.toUpperCase()}`
            return (
              <Link
                key={`${session.group}-${session.type}`}
                to={`/season/${year}/${date}/${session.group}/${session.type}`}
                className="block rounded-lg border border-gray-700 bg-gray-900 p-4 hover:border-red-700 hover:bg-gray-800 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-100">{label}</h2>
                <p className="text-sm text-gray-500 mt-1">{session.entries.length} drivers</p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
