import { useMemo, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useDriverNames, useGeneralClassification, useSeason } from '../hooks/useResults'
import { computeDriverSeason } from '../services/driverSeason'

// Seasons shown as tabs on driver pages, newest first
const DRIVER_SEASONS = [2026]

const shortRound = (round: string) => round.split(' - ')[0]

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{children}</div>
    </div>
  )
}

function SeasonTab({ year, driver }: { year: number; driver: string }) {
  const season = useSeason(year)
  const classification = useGeneralClassification(year)
  const facts = useMemo(() => (season ? computeDriverSeason(season, driver) : null), [season, driver])
  const standing = classification.find((c) => c.driver === driver)

  if (!facts || facts.roundsRaced === 0) {
    return <p className="text-gray-500">Didn't race in the {year} season.</p>
  }

  const pointsFor = (date: string) => standing?.raceScores.find((s) => s.date === date)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Championship">
          {standing ? `P${standing.position}` : '—'}
          {standing && <span className="text-base font-normal text-gray-400"> · {standing.totalPoints} pts</span>}
        </Tile>
        <Tile label="Rounds">
          {facts.roundsRaced}
          <span className="text-base font-normal text-gray-400">/{facts.rounds.length}</span>
        </Tile>
        <Tile label="Wins">{facts.wins}</Tile>
        <Tile label="Podiums">{facts.podiums}</Tile>
        <Tile label="Fastest laps">{facts.fastestLaps}</Tile>
        <Tile label="Best finish">
          {facts.bestFinish ? `${facts.bestFinish.group.toUpperCase()} · P${facts.bestFinish.position}` : '—'}
        </Tile>
        <Tile label="Best qualifying">{facts.bestQualiPosition ? `P${facts.bestQualiPosition}` : '—'}</Tile>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Round</th>
              <th className="px-4 py-3 text-right">Quali</th>
              <th className="px-4 py-3 text-right">Quali lap</th>
              <th className="px-4 py-3 text-center">Group</th>
              <th className="px-4 py-3 text-right">Race</th>
              <th className="px-4 py-3 text-right">Best lap</th>
              <th className="px-4 py-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {facts.rounds.map((r) => {
              const score = pointsFor(r.date)
              const missed = r.racePosition === null
              return (
                <tr key={r.date} className="border-t border-gray-700">
                  <td className="px-4 py-3 text-gray-200">{shortRound(r.round)}</td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {r.qualiPosition ? `P${r.qualiPosition}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-400">{r.qualiLap ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-300">{r.raceGroup?.toUpperCase() ?? '—'}</td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${
                      r.racePosition === 1 ? 'text-yellow-400' : missed ? 'text-gray-600' : 'text-gray-200'
                    }`}
                  >
                    {missed ? '—' : `P${r.racePosition}`}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${r.fastestLap ? 'text-purple-400' : 'text-gray-400'}`}
                  >
                    {r.raceLap ?? '—'}
                    {r.fastestLap && ' ⚡'}
                  </td>
                  <td
                    className={`px-4 py-3 text-right ${score?.counted ? 'text-green-400 font-bold' : 'text-gray-500'}`}
                    title={score && !score.counted ? 'Not among the best 6 results' : undefined}
                  >
                    {score?.points ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">
        Quali is the position across both qualifying groups combined. ⚡ marks the fastest lap of the race. Greyed-out
        points don't count towards the championship (only the best 6 do).
      </p>
    </div>
  )
}

export function DriverPage() {
  const { name } = useParams<{ name: string }>()
  const names = useDriverNames()
  const slug = (name ?? '').toLowerCase()
  // Fall back to the address itself for drivers that only appear outside the race results
  const driver = names.find((n) => n.toLowerCase() === slug) ?? slug
  const [year, setYear] = useState(DRIVER_SEASONS[0])

  return (
    <div>
      <h1 className="text-2xl font-bold uppercase text-white mb-4">{driver}</h1>
      <div className="flex gap-1 mb-6 border-b border-gray-700">
        {DRIVER_SEASONS.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
              y === year
                ? 'border-red-500 text-red-400 font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-100'
            }`}
          >
            {y}
          </button>
        ))}
      </div>
      <SeasonTab year={year} driver={driver} />
    </div>
  )
}
