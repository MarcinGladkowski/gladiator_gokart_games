import type { Registration } from '../types'

export const ENROLL_WINDOW_MS = 24 * 60 * 60 * 1000

export interface PartitionResult {
  grid: Registration[]
  reserve: Registration[]
}

export function partitionDrivers(
  registrations: Registration[],
  staff: string[],
  gridSize: number,
  enrollOpenDateTime: Date,
): PartitionResult {
  const enrollCloseDateTime = new Date(enrollOpenDateTime.getTime() + ENROLL_WINDOW_MS)
  const staffSet = new Set(staff.map((s) => s.trim().toLowerCase()))

  const onTime = registrations.filter((r) => r.registrationDateTime <= enrollCloseDateTime)
  const late = registrations.filter((r) => r.registrationDateTime > enrollCloseDateTime)

  const staffDrivers = onTime.filter((r) => staffSet.has(r.nickname))
  const nonStaff = onTime.filter((r) => !staffSet.has(r.nickname))
  const remainingSpots = Math.max(0, gridSize - staffDrivers.length)

  return {
    grid: [...staffDrivers, ...nonStaff.slice(0, remainingSpots)],
    reserve: [...nonStaff.slice(remainingSpots), ...late],
  }
}
