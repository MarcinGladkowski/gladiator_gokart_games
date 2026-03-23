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

    const entries: GridEntry[] = registrations.map((registration) => ({
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

    registrationsOnTime.sort((a, b) => (a.standing?.position ?? Infinity) - (b.standing?.position ?? Infinity))

    const grid = registrationsOnTime.slice(0, this.gridSize)


    const reserve = [...registrationsOnTime.slice(this.gridSize), ...late]

    return { grid, reserve }
  }
}
