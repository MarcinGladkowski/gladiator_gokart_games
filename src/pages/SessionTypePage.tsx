import { useParams, Link } from 'react-router-dom'
import { useSessionsByType } from '../hooks/useResults'
import type { QualificationEntry, RaceEntry } from '../types'
import { QualificationsTable } from '../components/tables/QualificationsTable'
import { RaceTable } from '../components/tables/RaceTable'

export function SessionTypePage() {
  const { year, date, type } = useParams<{
    year: string
    date: string
    type: string
  }>()

  const sessions = useSessionsByType(Number(year), date ?? '', type ?? '')

  if (sessions.length === 0) {
    return <p className="text-gray-500">Session not found.</p>
  }

  const sessionLabel = type === 'qualifications' ? 'Qualifications' : 'Race'

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
        <span className="text-gray-300">{sessionLabel}</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-6">{sessionLabel}</h1>

      <div className="space-y-10">
        {sessions.map((session) => (
          <div key={session.group}>
            {sessions.length > 1 && (
              <h2 className="text-lg font-semibold text-gray-100 mb-3">
                Group {session.group.toUpperCase()}
              </h2>
            )}
            {session.type === 'qualifications' ? (
              <QualificationsTable entries={session.entries as QualificationEntry[]} />
            ) : (
              <RaceTable entries={session.entries as RaceEntry[]} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
