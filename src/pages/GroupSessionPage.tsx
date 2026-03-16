import { useParams, Link } from 'react-router-dom'
import { useSession } from '../hooks/useResults'
import type { QualificationEntry, RaceEntry } from '../types'
import { QualificationsTable } from '../components/tables/QualificationsTable'
import { RaceTable } from '../components/tables/RaceTable'

export function GroupSessionPage() {
  const { year, date, group, type } = useParams<{
    year: string
    date: string
    group: string
    type: string
  }>()

  const session = useSession(Number(year), date ?? '', group ?? '', type ?? '')

  if (!session) {
    return <p className="text-gray-500">Session not found.</p>
  }

  const sessionLabel = session.type === 'qualifications' ? 'Qualifications' : 'Race'
  const groupLabel = session.group.toUpperCase()

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
        <span className="text-gray-300">
          {sessionLabel} {groupLabel}
        </span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-6">
        {sessionLabel} — Group {groupLabel}
      </h1>

      {session.type === 'qualifications' ? (
        <QualificationsTable entries={session.entries as QualificationEntry[]} />
      ) : (
        <RaceTable entries={session.entries as RaceEntry[]} />
      )}
    </div>
  )
}

