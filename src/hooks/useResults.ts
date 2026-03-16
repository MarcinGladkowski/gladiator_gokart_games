import type { AppData, Season, RaceEvent, Session, TotalResultEntry } from '../types'
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
