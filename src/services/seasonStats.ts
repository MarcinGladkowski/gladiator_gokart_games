import type { Season, RaceEvent, QualificationEntry, RaceEntry } from '../types'
import { parseLapTimeToMs } from '../hooks/useResults'

// Drivers need at least this many rounds to appear in pace / consistency / improvement rankings
export const MIN_ROUNDS = 4
// Number of rounds averaged at the start and end of a driver's season for "most improved"
const IMPROVEMENT_WINDOW = 2

export interface Tally {
  driver: string
  count: number
}

// 'all' covers both groups; 'a' / 'b' restrict to sessions of that group
export type GroupFilter = 'all' | 'a' | 'b'

export interface RaceWin {
  round: string
  group: string
  driver: string
}

export interface BackToBackWin {
  driver: string
  rounds: string[]
}

export interface FastestLapRace {
  round: string
  group: string
  driver: string
  position: number
  bestLap: string
}

export interface PaceEntry {
  driver: string
  rounds: number
  // Average of the per-round gap (in %) between the driver's best race lap and the round's fastest race lap
  avgGapPct: number
  // Standard deviation of that gap — lower means more consistent
  stdDevPct: number
}

export interface ImprovementEntry {
  driver: string
  startGapPct: number
  endGapPct: number
  // Positive = the driver got closer to the front
  improvementPct: number
}

export interface PoleConversion {
  round: string
  qualiGroup: string
  driver: string
  raceGroup: string | null
  racePosition: number | null
}

export interface ClosestQuali {
  round: string
  group: string
  pole: string
  second: string
  gapMs: number
}

export interface SeasonStats {
  racesCount: number
  wins: Tally[]
  // Every race win in date order
  raceWins: RaceWin[]
  podiums: Tally[]
  distinctWinners: number
  backToBackWins: BackToBackWin[]
  fastestLaps: Tally[]
  // Every race's fastest lap in date order
  fastestLapRaces: FastestLapRace[]
  fastestLapNoPodium: FastestLapRace[]
  pace: PaceEntry[]
  consistency: PaceEntry[]
  improvement: ImprovementEntry[]
  poles: Tally[]
  poleConversions: PoleConversion[]
  closestQualis: ClosestQuali[]
}

function toTallies(counts: Map<string, number>): Tally[] {
  return [...counts]
    .map(([driver, count]) => ({ driver, count }))
    .sort((x, y) => y.count - x.count || x.driver.localeCompare(y.driver))
}

function increment(counts: Map<string, number>, driver: string) {
  counts.set(driver, (counts.get(driver) ?? 0) + 1)
}

function raceSessions(event: RaceEvent, group: GroupFilter) {
  return event.sessions
    .filter((s) => s.type === 'race' && (group === 'all' || s.group.toLowerCase() === group))
    .map((s) => ({ group: s.group.toLowerCase(), entries: s.entries as RaceEntry[] }))
    .sort((x, y) => x.group.localeCompare(y.group))
}

function qualiSessions(event: RaceEvent, group: GroupFilter) {
  return event.sessions
    .filter((s) => s.type === 'qualifications' && (group === 'all' || s.group.toLowerCase() === group))
    .map((s) => ({ group: s.group.toLowerCase(), entries: s.entries as QualificationEntry[] }))
    .sort((x, y) => x.group.localeCompare(y.group))
}

// Same rule as the season classification: first driver in result order with the lowest best lap
export function fastestDriver(entries: RaceEntry[]): RaceEntry | undefined {
  let fastest: RaceEntry | undefined
  for (const entry of entries) {
    if (!fastest || parseLapTimeToMs(entry.bestLap) < parseLapTimeToMs(fastest.bestLap)) fastest = entry
  }
  return fastest
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function stdDev(values: number[]): number {
  const m = mean(values)
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)))
}

export function computeSeasonStats(season: Season, group: GroupFilter = 'all'): SeasonStats {
  const events = season.events
    .filter((e) => !e.upcoming)
    .sort((x, y) => x.date.localeCompare(y.date))

  const wins = new Map<string, number>()
  const raceWins: RaceWin[] = []
  const podiums = new Map<string, number>()
  const fastestLaps = new Map<string, number>()
  const fastestLapRaces: FastestLapRace[] = []
  const winnersByRound: Array<{ round: string; winners: Set<string> }> = []
  // driver -> chronological list of gaps (%) to the round's fastest race lap
  const gapsByDriver = new Map<string, number[]>()
  const poles = new Map<string, number>()
  const poleConversions: PoleConversion[] = []
  const closestQualis: ClosestQuali[] = []
  let racesCount = 0

  for (const event of events) {
    const races = raceSessions(event, group)
    const roundWinners = new Set<string>()

    for (const race of races) {
      if (race.entries.length === 0) continue
      racesCount++

      for (const entry of race.entries) {
        if (entry.position === 1) {
          increment(wins, entry.driver)
          raceWins.push({ round: event.label, group: race.group, driver: entry.driver })
          roundWinners.add(entry.driver)
        }
        if (entry.position <= 3) increment(podiums, entry.driver)
      }

      const fastest = fastestDriver(race.entries)
      if (fastest) {
        increment(fastestLaps, fastest.driver)
        fastestLapRaces.push({
          round: event.label,
          group: race.group,
          driver: fastest.driver,
          position: fastest.position,
          bestLap: fastest.bestLap,
        })
      }
    }
    winnersByRound.push({ round: event.label, winners: roundWinners })

    // Pace: compare every race best lap against the fastest race lap of the round (within the filtered
    // group(s)), so rounds on different layouts or in different conditions are comparable
    const roundEntries = races.flatMap((r) => r.entries)
    if (roundEntries.length > 0) {
      const reference = Math.min(...roundEntries.map((e) => parseLapTimeToMs(e.bestLap)))
      for (const entry of roundEntries) {
        const gapPct = ((parseLapTimeToMs(entry.bestLap) - reference) / reference) * 100
        const gaps = gapsByDriver.get(entry.driver) ?? []
        gaps.push(gapPct)
        gapsByDriver.set(entry.driver, gaps)
      }
    }

    // Pole sitters of qualifying group B usually race in group A, so look up the race result in any group
    const allRaces = raceSessions(event, 'all')
    for (const quali of qualiSessions(event, group)) {
      const { entries } = quali
      const sorted = [...entries].sort((x, y) => x.position - y.position)
      const [pole, second] = sorted
      if (!pole) continue
      increment(poles, pole.driver)

      const raceResult = allRaces
        .map((r) => ({ group: r.group, entry: r.entries.find((e) => e.driver === pole.driver) }))
        .find((r) => r.entry)
      poleConversions.push({
        round: event.label,
        qualiGroup: quali.group,
        driver: pole.driver,
        raceGroup: raceResult?.group ?? null,
        racePosition: raceResult?.entry?.position ?? null,
      })

      if (second) {
        closestQualis.push({
          round: event.label,
          group: quali.group,
          pole: pole.driver,
          second: second.driver,
          gapMs: parseLapTimeToMs(second.bestLap) - parseLapTimeToMs(pole.bestLap),
        })
      }
    }
  }

  const backToBackWins: BackToBackWin[] = []
  const allWinners = new Set(winnersByRound.flatMap((r) => [...r.winners]))
  for (const driver of allWinners) {
    let streak: string[] = []
    const flush = () => {
      if (streak.length >= 2) backToBackWins.push({ driver, rounds: streak })
      streak = []
    }
    for (const { round, winners } of winnersByRound) {
      if (winners.has(driver)) streak.push(round)
      else flush()
    }
    flush()
  }
  backToBackWins.sort((x, y) => y.rounds.length - x.rounds.length || x.driver.localeCompare(y.driver))

  const pace: PaceEntry[] = [...gapsByDriver]
    .filter(([, gaps]) => gaps.length >= MIN_ROUNDS)
    .map(([driver, gaps]) => ({ driver, rounds: gaps.length, avgGapPct: mean(gaps), stdDevPct: stdDev(gaps) }))

  const improvement: ImprovementEntry[] = [...gapsByDriver]
    .filter(([, gaps]) => gaps.length >= MIN_ROUNDS)
    .map(([driver, gaps]) => {
      const startGapPct = mean(gaps.slice(0, IMPROVEMENT_WINDOW))
      const endGapPct = mean(gaps.slice(-IMPROVEMENT_WINDOW))
      return { driver, startGapPct, endGapPct, improvementPct: startGapPct - endGapPct }
    })
    .sort((x, y) => y.improvementPct - x.improvementPct)

  return {
    racesCount,
    wins: toTallies(wins),
    raceWins,
    podiums: toTallies(podiums),
    distinctWinners: allWinners.size,
    backToBackWins,
    fastestLaps: toTallies(fastestLaps),
    fastestLapRaces,
    fastestLapNoPodium: fastestLapRaces.filter((x) => x.position > 3),
    pace: [...pace].sort((x, y) => x.avgGapPct - y.avgGapPct),
    consistency: [...pace].sort((x, y) => x.stdDevPct - y.stdDevPct),
    improvement,
    poles: toTallies(poles),
    poleConversions,
    closestQualis: closestQualis.sort((x, y) => x.gapMs - y.gapMs),
  }
}
