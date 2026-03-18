import { useParams, Link } from 'react-router-dom'
import { useRaceEvent } from '../hooks/useResults'
import { daysLeft } from '../utils/daysLeft'
import { GoogleSheetTable } from '../components/GoogleSheetTable'

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
        <>
          <p className="text-lg mb-8">
            {daysLeft(event.date) === 0
              ? <strong className="text-white">Today!</strong>
              : <span className="text-gray-500">{daysLeft(event.date)} days left</span>
            }
          </p>
          {date === '2026-04-23' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">Registered drivers</h2>
                <GoogleSheetTable csvUrl="https://docs.google.com/spreadsheets/d/e/2PACX-1vRUDyRm1lKRO6mVLUchz1lT5nYwEtLJgWo0WSSF8469BIJmNOqxqN13RYIyCiQKt9Kq2qiGwTt68zOM/pub?output=csv&gid=178342750" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">Enrollment</h2>
                <div className="rounded-lg overflow-hidden border border-gray-700">
                  <iframe
                    src="https://docs.google.com/forms/d/e/1FAIpQLSeIKathI3As_-4Wyn7yrT2I8W5Zq2HtMQ1JkelSr3R-HOSXGw/viewform?embedded=true"
                    width="100%"
                    height="900"
                    style={{ border: 0 }}
                    title="Race enrollment form"
                  >
                    Loading…
                  </iframe>
                </div>
              </div>
            </div>
          )}
        </>
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
