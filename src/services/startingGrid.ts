import type { GroupLetter, LapTime, QualificationEntry, Session } from '../types'
import { parseLapTimeToMs } from '../hooks/useResults'

export const RACE_GROUP_SIZE = 13

export interface StartingGridSlot {
  position: number
  driver: string
  bestLap: LapTime
  qualiGroup: GroupLetter
  qualiPosition: number
}

export interface StartingGrid {
  a: StartingGridSlot[]
  b: StartingGridSlot[]
}

// Both qualifying groups are ranked together by best lap: the fastest drivers start race A,
// the rest start race B, each in the order of that combined ranking
export function buildStartingGrid(sessions: Session[], groupSize = RACE_GROUP_SIZE): StartingGrid | null {
  const qualifications = sessions.filter((s) => s.type === 'qualifications')
  const groups = new Set(qualifications.map((s) => s.group.toLowerCase()))
  if (!groups.has('a') || !groups.has('b')) return null

  const lapMs = (lap: LapTime) => (lap ? parseLapTimeToMs(lap) : Infinity)

  const ranked = qualifications
    .flatMap((session) =>
      (session.entries as QualificationEntry[]).map((entry) => ({
        driver: entry.driver,
        bestLap: entry.bestLap,
        qualiGroup: session.group.toLowerCase(),
        qualiPosition: entry.position,
      })),
    )
    .sort((x, y) => lapMs(x.bestLap) - lapMs(y.bestLap) || x.qualiPosition - y.qualiPosition)

  const toSlots = (entries: typeof ranked) => entries.map((entry, i) => ({ position: i + 1, ...entry }))

  return {
    a: toSlots(ranked.slice(0, groupSize)),
    b: toSlots(ranked.slice(groupSize)),
  }
}
