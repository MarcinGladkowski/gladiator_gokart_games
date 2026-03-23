import type { Registration, TotalResultEntry, PartitionResult} from '../types'

export const ENROLL_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours, after that drivers are moved to reserve list

export class DriversGridService {
  private readonly staffSet: Set<string>
  private readonly leagueStandings: TotalResultEntry[]
  private readonly enrollCloseDateTime: Date
  private readonly gridSize: number

  constructor(
    staff: string[],
    gridSize: number,
    enrollOpenDateTime: Date,
    leagueStandings: TotalResultEntry[],
  ) {
    this.staffSet = new Set(staff.map((staffName) => staffName.trim().toLowerCase()))
    this.leagueStandings = leagueStandings
    this.enrollCloseDateTime = new Date(enrollOpenDateTime.getTime() + ENROLL_WINDOW_MS)
    this.gridSize = gridSize
  }

  partition(registrations: Registration[]): PartitionResult {

    registrations = registrations.map(registration => {
      const standing = this.leagueStandings.find(s => s.nickname.trim().toLowerCase() === registration.nickname.trim().toLowerCase())
      return {
        ...registration,
        ...standing
      }
    })

    const gridEligible = registrations.filter((registration) => registration.registrationDateTime <= this.enrollCloseDateTime)
    const late = registrations.filter((registration) => registration.registrationDateTime > this.enrollCloseDateTime)

    // const staffDrivers = gridEligible.filter(
    //   (registration) => this.staffSet.has(registration.nickname.trim().toLowerCase())
    // )

    // sort by position in league standings

    const grid = [...gridEligible]
    const reserve = [...grid.slice(this.gridSize), ...late]

    const finalGrid = grid.slice(0, this.gridSize)

    return { grid: finalGrid, reserve: reserve }
  }
}
