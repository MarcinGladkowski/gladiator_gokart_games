import { Link } from 'react-router-dom'
import { useSeasons } from '../hooks/useResults'
import type { RaceEvent, Season } from '../types'

type EventWithYear = { event: RaceEvent; year: number }

export function HomePage() {
  const seasons = useSeasons()

  const allEvents: EventWithYear[] = seasons.flatMap((s: Season) =>
    s.events.map((e) => ({ event: e, year: s.year })),
  )

  const lastRound = [...allEvents]
    .filter(({ event }) => !event.upcoming)
    .at(-1)

  const nextRound = allEvents.find(({ event }) => event.upcoming)

  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <h1 className="text-2xl font-bold text-white mb-2">Gladiator Gokart Games</h1>
      {lastRound && (
        <Link
          to={`/season/${lastRound.year}/${lastRound.event.date}`}
          className="block rounded-lg border border-gray-700 bg-gray-900 p-5 hover:border-red-700 hover:bg-gray-800 transition-colors"
        >
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last round</p>
          <p className="text-lg font-semibold text-gray-100">{lastRound.event.label}</p>
          <p className="text-sm text-gray-500 mt-0.5">{lastRound.event.date}</p>
        </Link>
      )}
      {nextRound && (
        <Link
          to={`/season/${nextRound.year}/${nextRound.event.date}`}
          className="block rounded-lg border border-gray-700 bg-gray-900 p-5 hover:border-red-700 hover:bg-gray-800 transition-colors"
        >
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next round</p>
          <p className="text-lg font-semibold text-gray-100">{nextRound.event.label}</p>
          <p className="text-sm text-gray-500 mt-0.5">{nextRound.event.date}</p>
        </Link>
      )}
    </div>
  )
}
