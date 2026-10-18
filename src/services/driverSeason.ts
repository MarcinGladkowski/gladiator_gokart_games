import type { Season, RaceEntry, QualificationEntry } from '../types'
import { parseLapTimeToMs } from '../hooks/useResults'
import { fastestDriver } from './seasonStats'

export interface DriverRound {
  date: string
  round: string
  // Position across both qualifying groups combined (the 13 fastest race in group A)
  qualiPosition: number | null
  qualiLap: string | null
  raceGroup: string | null
  racePosition: number | null
  raceLap: string | null
  fastestLap: boolean
}

export interface DriverSeason {
  // Every completed round of the season; rounds the driver missed have null results
  rounds: DriverRound[]
  roundsRaced: number
  wins: number
  podiums: number
  fastestLaps: number
  // A group A result always ranks above a group B result
  bestFinish: { group: string; position: number } | null
  bestQualiPosition: number | null
}

export function computeDriverSeason(season: Season, driver: string): DriverSeason {
  const events = season.events.filter((e) => !e.upcoming).sort((x, y) => x.date.localeCompare(y.date))

  const rounds: DriverRound[] = events.map((event) => {
    const qualis = event.sessions
      .filter((s) => s.type === 'qualifications')
      .flatMap((s) => s.entries as QualificationEntry[])
      .sort((x, y) => parseLapTimeToMs(x.bestLap) - parseLapTimeToMs(y.bestLap))
    const qualiIdx = qualis.findIndex((e) => e.driver === driver)

    const race = event.sessions
      .filter((s) => s.type === 'race')
      .map((s) => ({ group: s.group.toLowerCase(), entries: s.entries as RaceEntry[] }))
      .map((s) => ({ ...s, entry: s.entries.find((e) => e.driver === driver) }))
      .find((s) => s.entry)

    return {
      date: event.date,
      round: event.label,
      qualiPosition: qualiIdx === -1 ? null : qualiIdx + 1,
      qualiLap: qualiIdx === -1 ? null : qualis[qualiIdx].bestLap,
      raceGroup: race?.group ?? null,
      racePosition: race?.entry?.position ?? null,
      raceLap: race?.entry?.bestLap ?? null,
      fastestLap: !!race && fastestDriver(race.entries)?.driver === driver,
    }
  })

  const raced = rounds.filter((r) => r.racePosition !== null)
  const finishes = raced
    .map((r) => ({ group: r.raceGroup!, position: r.racePosition! }))
    .sort((x, y) => x.group.localeCompare(y.group) || x.position - y.position)
  const qualiPositions = rounds.flatMap((r) => (r.qualiPosition === null ? [] : [r.qualiPosition]))

  return {
    rounds,
    roundsRaced: raced.length,
    wins: raced.filter((r) => r.racePosition === 1).length,
    podiums: raced.filter((r) => r.racePosition! <= 3).length,
    fastestLaps: rounds.filter((r) => r.fastestLap).length,
    bestFinish: finishes[0] ?? null,
    bestQualiPosition: qualiPositions.length > 0 ? Math.min(...qualiPositions) : null,
  }
}
