import type { Registration, TotalResultEntry } from '../types'

export const ENROLL_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours, after that drivers are moved to reserve list

export interface PartitionResult {
  grid: Registration[]
  reserve: Registration[]
}

export function partitionDrivers(
  registrations: Registration[],
  staff: string[],
  gridSize: number,
  enrollOpenDateTime: Date,
  leagueStandings: TotalResultEntry[],
): PartitionResult {
  const enrollCloseDateTime = new Date(enrollOpenDateTime.getTime() + ENROLL_WINDOW_MS)
  const staffSet = new Set(staff.map((s) => s.trim().toLowerCase()))
  const leagueSet = new Set(leagueStandings.map((e) => e.nickname.trim().toLowerCase()))

  const onTime = registrations.filter((r) => r.registrationDateTime <= enrollCloseDateTime)
  const late = registrations.filter((r) => r.registrationDateTime > enrollCloseDateTime)

  const gridEligible = onTime.filter((r) => !leagueSet.has(r.nickname))
  const knownReserve = onTime.filter((r) => leagueSet.has(r.nickname))

  const staffDrivers = gridEligible.filter((r) => staffSet.has(r.nickname))
  const nonStaff = gridEligible.filter((r) => !staffSet.has(r.nickname))
  const remainingSpots = Math.max(0, gridSize - staffDrivers.length)

  return {
    grid: [...staffDrivers, ...nonStaff.slice(0, remainingSpots)],
    reserve: [...nonStaff.slice(remainingSpots), ...knownReserve, ...late],
  }
}
