import type { AppData, Season, RaceEvent, Session, TotalResultEntry, ClassificationEntry, RaceScore, RaceEntry } from '../types'
import resultsData from '../data/results.json'

const data = resultsData as AppData

export function useResults(): AppData {
  return data
}

export function useSeasons(): Season[] {
  return data.seasons
}

export function useSeason(year: number): Season | undefined {
  return data.seasons.find((s) => s.year === year)
}

export function useRaceEvent(year: number, date: string): RaceEvent | undefined {
  return useSeason(year)?.events.find((e) => e.date === date)
}

export function useSession(
  year: number,
  date: string,
  group: string,
  type: string,
): Session | undefined {
  return useRaceEvent(year, date)?.sessions.find(
    (s) => s.group === group && s.type === type,
  )
}

export function useTotalResults(): TotalResultEntry[] {
  return data.totalResults
}

const GROUP_A_POINTS = [50, 44, 40, 36, 34, 32, 30, 28, 26, 24, 22, 20, 18, 16]
const GROUP_B_POINTS = [18, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
const FASTEST_LAP_BONUS: Record<string, number> = { a: 2, b: 1 }
const BEST_N = 6

function parseLapTimeToMs(lapTime: string): number {
  const colonIdx = lapTime.indexOf(':')
  if (colonIdx === -1) return Infinity
  const minutes = parseInt(lapTime.slice(0, colonIdx), 10)
  const rest = lapTime.slice(colonIdx + 1)
  const dotIdx = rest.indexOf('.')
  const seconds = parseInt(dotIdx === -1 ? rest : rest.slice(0, dotIdx), 10)
  const ms = dotIdx === -1 ? 0 : parseInt(rest.slice(dotIdx + 1), 10)
  return minutes * 60000 + seconds * 1000 + ms
}

export function useGeneralClassification(year: number): ClassificationEntry[] {
  const season = useSeason(year)
  if (!season) return []

  const driverScores = new Map<string, Array<{ date: string; group: string; points: number }>>()

  for (const event of season.events) {
    for (const session of event.sessions) {
      if (session.type !== 'race') continue
      const group = session.group.toLowerCase()
      if (group !== 'a' && group !== 'b') continue

      const pointsTable = group === 'a' ? GROUP_A_POINTS : GROUP_B_POINTS
      const fastestBonus = FASTEST_LAP_BONUS[group] ?? 0
      const entries = session.entries as RaceEntry[]

      let fastestTime = Infinity
      let fastestDriver = ''
      for (const entry of entries) {
        const t = parseLapTimeToMs(entry.bestLap)
        if (t < fastestTime) {
          fastestTime = t
          fastestDriver = entry.driver
        }
      }

      for (const entry of entries) {
        const posPoints = pointsTable[entry.position - 1] ?? 0
        const lapBonus = entry.driver === fastestDriver ? fastestBonus : 0
        const points = posPoints + lapBonus
        const existing = driverScores.get(entry.driver) ?? []
        existing.push({ date: event.date, group, points })
        driverScores.set(entry.driver, existing)
      }
    }
  }

  const classification: ClassificationEntry[] = []

  for (const [driver, scores] of driverScores) {
    const sorted = [...scores].sort((a, b) => b.points - a.points)
    const countedKeys = new Set(sorted.slice(0, BEST_N).map((s) => `${s.date}-${s.group}`))

    const raceScores: RaceScore[] = scores.map((s) => ({
      date: s.date,
      group: s.group,
      points: s.points,
      counted: countedKeys.has(`${s.date}-${s.group}`),
    }))

    const totalPoints = raceScores.filter((s) => s.counted).reduce((sum, s) => sum + s.points, 0)

    classification.push({
      position: 0,
      driver,
      totalPoints,
      racesCount: scores.length,
      raceScores,
    })
  }

  classification.sort((a, b) => b.totalPoints - a.totalPoints)
  classification.forEach((e, i) => {
    e.position = i + 1
  })

  return classification
}
