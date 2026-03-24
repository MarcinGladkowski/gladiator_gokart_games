import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useRaceEvent } from '../hooks/useResults'
import { useTotalResults } from '../hooks/useResults'
import { useRegisteredDrivers } from '../hooks/useRegisteredDrivers'
import { daysLeft } from '../utils/daysLeft'
import { GoogleSheetTable } from '../components/GoogleSheetTable'
import config from '../data/config.json'
import { DriversGridService } from '../services/partitionDrivers'

const REGISTRATIONS_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRUDyRm1lKRO6mVLUchz1lT5nYwEtLJgWo0WSSF8469BIJmNOqxqN13RYIyCiQKt9Kq2qiGwTt68zOM/pub?output=csv&gid=178342750'

export function RaceDatePage() {
  const { year, date } = useParams<{ year: string; date: string }>()
  const event = useRaceEvent(Number(year), date ?? '')
  const [refreshKey, setRefreshKey] = useState(0)
  const drivers = useRegisteredDrivers(REGISTRATIONS_CSV, refreshKey)
  const leagueStandings = useTotalResults()

  useEffect(() => {
    const id = setInterval(() => setRefreshKey((k) => k + 1), 20_000)
    return () => clearInterval(id)
  }, [])

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
          {date === '2026-04-23' && (() => {
            // TODO: restore to event-based calculation: new Date(new Date(event.date).getTime() - 14 * 24 * 60 * 60 * 1000)
            const enrollOpenDateTime = new Date(Date.now() - 1 * 60 * 60 * 1000)
            return (
            <div className="space-y-8">
              <div className="rounded-lg border border-yellow-600 bg-yellow-950 px-4 py-3 text-yellow-400 text-sm font-medium">
                ⚠ Under testing — results on this page may not reflect the final starting grid.
              </div>
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="w-full lg:w-[640px] lg:shrink-0">
                  <h2 className="text-lg font-semibold text-white mb-1">Enrollment</h2>
                  <p className="text-xs text-gray-500 mb-3">Open since: {enrollOpenDateTime.toLocaleString()}</p>
                  <div className="rounded-lg overflow-hidden border border-gray-700 bg-white">
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-white">All sent requests - time ordered</h2>
                    <button
                      onClick={() => setRefreshKey((k) => k + 1)}
                      className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-gray-100 hover:border-gray-500 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                  <GoogleSheetTable key={refreshKey} csvUrl="https://docs.google.com/spreadsheets/d/e/2PACX-1vRUDyRm1lKRO6mVLUchz1lT5nYwEtLJgWo0WSSF8469BIJmNOqxqN13RYIyCiQKt9Kq2qiGwTt68zOM/pub?output=csv&gid=178342750" />
                </div>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
                {drivers === null ? (
                  <p className="text-gray-500 text-sm">Loading…</p>
                ) : drivers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No registrations yet.</p>
                ) : (() => {
                  const { grid, reserve } = new DriversGridService(26, enrollOpenDateTime, leagueStandings, config.staff).partition(drivers)
                  return (
                    <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
                      <div>
                        <h2 className="text-lg font-semibold text-white mb-4">Starting grid</h2>
                        <ol className="list-decimal list-inside space-y-1">
                          {grid.map((r, i) => (
                            <li key={i} className="text-gray-300 text-sm">{r.registration.nickname}</li>
                          ))}
                        </ol>
                      </div>
                      {reserve.length > 0 && (
                        <div>
                          <h2 className="text-lg font-semibold text-white mb-4">Reserve list</h2>
                          <ol className="list-decimal list-inside space-y-1" start={grid.length + 1}>
                            {reserve.map((r, i) => (
                              <li key={i} className="text-gray-300 text-sm">{r.registration.nickname}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          )})()}
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
