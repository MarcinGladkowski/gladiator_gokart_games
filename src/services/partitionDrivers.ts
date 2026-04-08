import { Registration, TotalResultEntry, PartitionResult, GridEvent, GridEntry } from '../types'

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
    let preGrid: GridEntry[] = [];
    let grid: GridEntry[] = [];
    let reserve: GridEntry[] = [];

    const events: GridEvent[] = registrations.map((registration) => ({
      registration: {
        ...registration,
        isStaff: this.staffSet.has(registration.nickname.trim().toLowerCase())
      },
      standing: this.leagueStandings.find(
        (standing) => standing.nickname.trim().toLowerCase() === registration.nickname.trim().toLowerCase()
      ),
      type: 'enroll',
      timestamp: registration.registrationDateTime,
    }))

    events.push({
      type: 'deadline',
      timestamp: this.enrollCloseDateTime,
    });

    events.filter(e => e.registration?.resignedAt != null)
      .forEach(e => events.push({
        type: 'resign',
        registration: e.registration,
        standing: e.standing,
        timestamp: e.registration?.resignedAt!,
      }));

    events.sort(this.sortingByTimestampAsc);

    events.forEach(event => {
      switch (event.type) {
        case 'enroll': {
          if (event.timestamp < this.enrollCloseDateTime) {
            preGrid.push({ ...event, registration: event.registration! });
            preGrid.sort(this.sortingByPositionAsc);
          } else {
            if (grid.length < this.gridSize) {
              grid.push({ ...event, registration: event.registration! });
              grid.sort(this.sortingByPositionAsc);
            } else {
              reserve.push({ ...event, registration: event.registration! });
              reserve.sort(this.sortingByPositionAsc);
            }
          }
        }; break;
        case 'resign': {
          if (event.timestamp < this.enrollCloseDateTime) {
            preGrid = preGrid.filter(e => e.registration?.nickname !== event.registration?.nickname);
          } else {
            const isOnGrid = grid.findIndex(e => e.registration?.nickname !== event.registration?.nickname) >= 0;
            if (isOnGrid) {
              grid = grid.filter(e => e.registration?.nickname !== event.registration?.nickname);
              if (reserve.length > 0) {
                grid.push(reserve[0]);
                reserve.shift();
              }
              grid.sort(this.sortingByPositionAsc);
            } else {
              reserve.push({ ...event, registration: event.registration! });
              reserve.sort(this.sortingByPositionAsc);
            }
          }
        }; break;
        case 'deadline': {
          const staff = preGrid.filter(e => e.registration.isStaff);
          grid.push(...staff);
          const remainingGridSpots = (this.gridSize - grid.length);
          const fitToGrid = preGrid.filter(e => !e.registration.isStaff).slice(0, remainingGridSpots);
          const nonFitToGrid = preGrid.filter(e => !e.registration.isStaff).slice(remainingGridSpots);


          grid.push(...fitToGrid);
          grid.sort(this.sortingByPositionAsc);
          reserve.push(...nonFitToGrid);
        }; break;
      }
    });

    return { grid, reserve }
  }
  
  sortingByPositionAsc = (a: GridEntry, b: GridEntry) => {
    return (a.standing?.position ?? Infinity) - (b.standing?.position ?? Infinity);
  }

  sortingByTimestampAsc = (a: GridEvent, b: GridEvent) => a.timestamp.getTime() - b.timestamp.getTime();

}
