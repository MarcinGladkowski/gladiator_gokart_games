import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useRaceEvent } from '../hooks/useResults'
import { useTotalResults } from '../hooks/useResults'
import { useRegisteredDrivers } from '../hooks/useRegisteredDrivers'
import { daysLeft } from '../utils/daysLeft'
import { GoogleSheetTable } from '../components/GoogleSheetTable'
import { EnrollmentForm } from '../components/EnrollmentForm'
import config from '../data/config.json'
import { RegistrationCountdown } from '../components/RegistrationCountdown'
import { DriversGridService } from '../services/partitionDrivers'
import knownDrivers from '../data/drivers.json'

const KNOWN_DRIVERS_SET = new Set((knownDrivers as string[]).map((n) => n.toUpperCase()))
const REGISTRATIONS_URL = 'https://script.google.com/macros/s/AKfycbzlFhTcpHRHmAjs-P6BIwOb_69VBq2GORweV975VXuI96RmGzlPSS4Mah0z_50bZA/exec'

export function RaceDatePage() {
  const { year, date } = useParams<{ year: string; date: string }>()
  const event = useRaceEvent(Number(year), date ?? '')
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<'enrollment' | 'grid'>('enrollment')
  const drivers = useRegisteredDrivers(REGISTRATIONS_URL, refreshKey)
  const leagueStandings = useTotalResults()

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
            const enrollOpenDateTime = new Date(`${event.date}T18:00:00`)
            enrollOpenDateTime.setDate(enrollOpenDateTime.getDate() - 14)
            const { grid, reserve } = drivers
              ? new DriversGridService(26, enrollOpenDateTime, leagueStandings, config.staff).partition(drivers)
              : { grid: [], reserve: [] }
            return (
            <div className="space-y-6">
              <div className="flex gap-1 border-b border-gray-700">
                {(['enrollment', 'grid'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === tab
                        ? 'border-red-600 text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab === 'enrollment' ? 'Enrollment' : '🏁 Starting Grid'}
                  </button>
                ))}
              </div>
              {activeTab === 'enrollment' && (
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  <div className="w-full lg:w-[640px] lg:shrink-0">
                    <div className="mb-3">
                      <RegistrationCountdown raceDate={event.date} />
                    </div>
                    {Date.now() < enrollOpenDateTime.getTime() ? (
                      <div className="rounded-lg border border-gray-700 bg-gray-900 p-6 text-center">
                        <p className="text-gray-400 text-sm font-medium mb-1">Enrollment not open yet</p>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
                          <EnrollmentForm
                            onSubmitted={() => setRefreshKey((k) => k + 1)}
                            registeredDrivers={drivers?.map((d) => d.originalNickname) ?? []}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-semibold text-white">Requests (It is not start order)</h2>
                      <button
                        onClick={() => setRefreshKey((k) => k + 1)}
                        className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-gray-100 hover:border-gray-500 transition-colors"
                      >
                        Refresh
                      </button>
                    </div>
                    <GoogleSheetTable
                      key={refreshKey}
                      url={REGISTRATIONS_URL}
                      rowFilter={(row) => KNOWN_DRIVERS_SET.has((row['Zawodnik'] ?? '').trim().toUpperCase())}
                      formatters={{
                        'Sygnatura czasowa': (v) => new Date(v).toLocaleString(),
                      }}
                      rowClassName={(row) => row['Wypis']?.trim() ? 'opacity-40 line-through' : ''}
                    />
                  </div>
                </div>
              )}
              {activeTab === 'grid' && (
                <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
                  <p className="text-xs text-gray-500 mb-4">
                    Provisional grid — subject to change until enrollment closes on{' '}
                    <span className="text-gray-300">{new Date(enrollOpenDateTime.getTime() + 24 * 60 * 60 * 1000).toLocaleString()}</span>.
                  </p>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setRefreshKey((k) => k + 1)}
                      className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-gray-100 hover:border-gray-500 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                  {drivers === null ? (
                    <p className="text-gray-500 text-sm">Loading…</p>
                  ) : drivers.length === 0 ? (
                    <p className="text-gray-500 text-sm">No registrations yet.</p>
                  ) : (() => {
                    const groupA = grid.slice(0, 13)
                    const groupB = grid.slice(13, 26)
                    return (
                      <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
                        {groupA.length > 0 && (
                          <div>
                            <h2 className="text-lg font-semibold text-white mb-4">Group A</h2>
                            <ol className="list-decimal list-inside space-y-1">
                              {groupA.map((r, i) => (
                                <li key={i} className="text-gray-300 text-sm">{r.registration.nickname}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {groupB.length > 0 && (
                          <div>
                            <h2 className="text-lg font-semibold text-white mb-4">Group B</h2>
                            <ol className="list-decimal list-inside space-y-1" start={14}>
                              {groupB.map((r, i) => (
                                <li key={i} className="text-gray-300 text-sm">{r.registration.nickname}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {reserve.length > 0 && (
                          <div>
                            <h2 className="text-lg font-semibold text-white mb-4">Reserve</h2>
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
              )}
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
