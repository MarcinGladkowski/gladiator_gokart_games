import type { Registration, TotalResultEntry, PartitionResult} from '../types'

export const ENROLL_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours, after that drivers are moved to reserve list

export class DriversGridService {
  private readonly staffSet: Set<string>
  private readonly leagueStandings: TotalResultEntry[]
  private readonly enrollCloseDateTime: Date

  constructor(
    staff: string[],
    _gridSize: number,
    enrollOpenDateTime: Date,
    leagueStandings: TotalResultEntry[],
  ) {
    this.staffSet = new Set(staff.map((staffName) => staffName.trim().toLowerCase()))
    this.leagueStandings = leagueStandings
    this.enrollCloseDateTime = new Date(enrollOpenDateTime.getTime() + ENROLL_WINDOW_MS)
  }

  partition(registrations: Registration[]): PartitionResult {
    const onTime = registrations.filter((registration) => registration.registrationDateTime <= this.enrollCloseDateTime)
    const late = registrations.filter((registration) => registration.registrationDateTime > this.enrollCloseDateTime)

    const gridEligible = onTime.filter((registration) => !this.leagueStandings.some((standing) => standing.nickname.trim().toLowerCase() === registration.nickname.trim().toLowerCase()))
    const staffDrivers = gridEligible.filter((registration) => this.staffSet.has(registration.nickname.trim().toLowerCase()))
    const nonStaff = gridEligible.filter((registration) => !this.staffSet.has(registration.nickname.trim().toLowerCase()))

    return {
      grid: [...staffDrivers, ...nonStaff],
      reserve: [...late],
    }
  }
}
