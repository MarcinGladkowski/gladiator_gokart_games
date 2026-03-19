export interface PartitionResult {
  grid: string[]
  reserve: string[]
}

export function normalize(name: string): string {
  return name.trim().toLowerCase()
}

export function partitionDrivers(
  drivers: string[],
  staff: string[],
  gridSize: number,
): PartitionResult {
  const staffSet = new Set(staff.map(normalize))
  const staffDrivers = drivers.filter((d) => staffSet.has(normalize(d)))
  const nonStaff = drivers.filter((d) => !staffSet.has(normalize(d)))
  const remainingSpots = Math.max(0, gridSize - staffDrivers.length)
  return {
    grid: [...staffDrivers, ...nonStaff.slice(0, remainingSpots)],
    reserve: nonStaff.slice(remainingSpots),
  }
}
