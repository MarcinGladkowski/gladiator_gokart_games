import type { Registration, TotalResultEntry, PartitionResult, GridEntry } from '../types'

export const ENROLL_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours, after that drivers are moved to reserve list

export class DriversGridService {
  private readonly leagueStandings: TotalResultEntry[]
  private readonly enrollCloseDateTime: Date
  private readonly gridSize: number
  private readonly staffSet: Set<string>

  constructor(
    gridSize: number,
    enrollOpenDateTime: Date,
    leagueStandings: TotalResultEntry[],
    staff: string[] = [],
  ) {
    this.staffSet = new Set(staff.map((staffName) => staffName.trim().toLowerCase()))
    this.leagueStandings = leagueStandings
    this.enrollCloseDateTime = new Date(enrollOpenDateTime.getTime() + ENROLL_WINDOW_MS)
    this.gridSize = gridSize
  }

  partition(registrations: Registration[]): PartitionResult {
    const active = registrations.filter((r) => !r.resignedAt)

    let entries: GridEntry[] = active.map((registration) => ({
      registration: {
        ...registration,
        isStaff: this.staffSet.has(registration.nickname.trim().toLowerCase())
      },
      standing: this.leagueStandings.find(
        (standing) => standing.nickname.trim().toLowerCase() === registration.nickname.trim().toLowerCase()
      ),
    }))

    const registrationsOnTime = entries.filter((entry) => entry.registration.registrationDateTime <= this.enrollCloseDateTime)
    const late = entries.filter((entry) => entry.registration.registrationDateTime > this.enrollCloseDateTime)

    const staffDriversOnTime = registrationsOnTime.filter((entry) => entry.registration.isStaff)

    let grid = [...staffDriversOnTime]

    const nonStaffDriversOnTime = registrationsOnTime.filter((entry) => !entry.registration.isStaff)

    const remainingGridSpots = (this.gridSize - grid.length)

    const fitToGrid = nonStaffDriversOnTime.slice(0, remainingGridSpots);

    const nonFitToGrid = nonStaffDriversOnTime.slice(remainingGridSpots)

    grid = [...grid, ...fitToGrid]

    grid.sort((a, b) => (a.standing?.position ?? Infinity) - (b.standing?.position ?? Infinity))

    let reserve = [...nonFitToGrid, ...late]

    reserve.sort((a, b) => (a.standing?.position ?? Infinity) - (b.standing?.position ?? Infinity))

    // FILLING MAIN GRID WITH RESERVE DRIVERS
    // if (grid.length < this.gridSize) {
    //   grid = [...grid, ...reserve.slice(0, this.gridSize - grid.length)]
    //   reserve = reserve.slice(this.gridSize - grid.length)
    // }

    return { grid, reserve }
  }
}
