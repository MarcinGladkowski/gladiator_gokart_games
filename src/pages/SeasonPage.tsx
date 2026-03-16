import { useParams, Link } from 'react-router-dom'
import { useSeason } from '../hooks/useResults'

export function SeasonPage() {
  const { year } = useParams<{ year: string }>()
  const season = useSeason(Number(year))

  if (!season) {
    return <p className="text-gray-500">Season {year} not found.</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Season {season.year}</h1>
      <div className="space-y-4">
        {season.events.map((event) => (
          <div key={event.date} className="rounded-lg border border-gray-700 bg-gray-900 p-4">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">
              <Link
                to={`/season/${season.year}/${event.date}`}
                className="hover:text-red-400 transition-colors"
              >
                {event.label}
              </Link>
            </h2>
            <div className="flex flex-wrap gap-2">
              {event.sessions.map((session) => (
                <Link
                  key={`${session.group}-${session.type}`}
                  to={`/season/${season.year}/${event.date}/${session.group}/${session.type}`}
                  className="px-3 py-1.5 rounded bg-gray-800 text-sm text-gray-300 hover:bg-red-900/40 hover:text-red-400 transition-colors"
                >
                  {session.type === 'qualifications' ? 'Qualifications' : 'Race'}{' '}
                  {session.group.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
