import { Link } from 'react-router-dom'
import { useSeasons, useGeneralClassification } from '../hooks/useResults'
import type { RaceEvent, Season } from '../types'
import { RegistrationCountdown } from '../components/RegistrationCountdown'

type EventWithYear = { event: RaceEvent; year: number }

function timeUntil(dateStr: string): string {
  const now = new Date()
  const warsawNowStr = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now).replace(' ', 'T')
  const warsawNow = new Date(warsawNowStr)
  const target = new Date(`${dateStr}T18:00:00`)
  const diffMs = target.getTime() - warsawNow.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 24) return `${Math.max(1, Math.ceil(diffHours))}h`
  return `${Math.ceil(diffHours / 24)} days`
}

export function HomePage() {
  const seasons = useSeasons()
  const classification2026 = useGeneralClassification(2026)

  const allEvents: EventWithYear[] = seasons.flatMap((s: Season) =>
    s.events.map((e) => ({ event: e, year: s.year })),
  )

  const lastRound = [...allEvents]
    .filter(({ event }) => !event.upcoming)
    .at(-1)

  const nextRound = allEvents.find(({ event }) => event.upcoming)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-white mb-2">Gladiator Gokart Games</h1>
      <div className="flex gap-4">
        {lastRound && (
          <Link
            to={`/season/${lastRound.year}/${lastRound.event.date}`}
            className="flex-1 block rounded-lg border border-gray-700 bg-gray-900 p-4 hover:border-red-700 hover:bg-gray-800 transition-colors"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last round</p>
            <p className="text-base font-semibold text-gray-100">{lastRound.event.label}</p>
            <p className="text-sm text-gray-500 mt-0.5">{lastRound.event.date}</p>
          </Link>
        )}
        {nextRound && (
          <Link
            to={`/season/${nextRound.year}/${nextRound.event.date}`}
            className="flex-1 block rounded-lg border border-gray-700 bg-gray-900 p-4 hover:border-red-700 hover:bg-gray-800 transition-colors"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next round</p>
            <p className="text-base font-semibold text-gray-100">{nextRound.event.label}</p>
            <p className="text-sm text-gray-500 mt-0.5">{nextRound.event.date}</p>
            <div className="mt-2 flex flex-col gap-1">
              <p className="text-sm text-gray-400">
                Race in <span className="text-white font-medium">{timeUntil(nextRound.event.date)}</span> <span className="text-gray-600">at 18:00</span>
              </p>
              <RegistrationCountdown raceDate={nextRound.event.date} />
            </div>
          </Link>
        )}
      </div>
      {classification2026.length > 0 && (
        <div className="rounded-lg border border-gray-700 bg-gray-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
            <p className="text-xs text-gray-500 uppercase tracking-wide">2026 Standings</p>
            <Link to="/season/2026/classification" className="text-xs text-red-500 hover:text-red-400">
              2026 classification →
            </Link>
          </div>
          <table className="min-w-full text-sm">
            <tbody>
              {classification2026.map((entry) => {
                const podiumColor = ['text-yellow-400', 'text-gray-300', 'text-orange-400'][entry.position - 1] ?? 'text-gray-300'
                return (
                  <tr key={entry.driver} className="border-t border-gray-700 first:border-t-0">
                    <td className={`px-4 py-2 text-right font-bold w-8 ${podiumColor}`}>{entry.position}</td>
                    <td className={`px-4 py-2 font-medium ${podiumColor}`}>{entry.driver}</td>
                    <td className="px-4 py-2 text-right text-green-400 font-bold">{entry.totalPoints}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
