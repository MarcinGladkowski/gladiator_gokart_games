import type { Registration } from '../types'

export interface PartitionResult {
  grid: Registration[]
  reserve: Registration[]
}

export function partitionDrivers(
  registrations: Registration[],
  staff: string[],
  gridSize: number,
): PartitionResult {
  const staffSet = new Set(staff.map((s) => s.trim().toLowerCase()))
  const staffDrivers = registrations.filter((r) => staffSet.has(r.nickname))
  const nonStaff = registrations.filter((r) => !staffSet.has(r.nickname))
  const remainingSpots = Math.max(0, gridSize - staffDrivers.length)
  return {
    grid: [...staffDrivers, ...nonStaff.slice(0, remainingSpots)],
    reserve: nonStaff.slice(remainingSpots),
  }
}
