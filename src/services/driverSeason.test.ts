import { describe, it, expect } from 'vitest'
import { computeDriverSeason } from './driverSeason'
import type { RaceEvent, Season, Session } from '../types'

const session = (type: Session['type'], group: string, results: Array<[string, string]>): Session => ({
  group,
  type,
  entries: results.map(([driver, bestLap], i) => ({
    position: i + 1,
    kartNumber: i + 1,
    driver,
    laps: 10,
    gap: null,
    bestLap,
  })),
})

const event = (n: number, sessions: Session[], upcoming = false): RaceEvent => ({
  date: `2026-0${n}-01`,
  label: `Race ${n}`,
  sessions,
  upcoming,
})

const season = (events: RaceEvent[]): Season => ({ year: 2026, events })

describe('computeDriverSeason', () => {
  const s = season([
    event(1, [
      session('qualifications', 'a', [
        ['Ann', '1:10.000'],
        ['Bob', '1:10.300'],
      ]),
      session('qualifications', 'b', [
        ['Cat', '1:10.100'],
        ['Dan', '1:11.000'],
      ]),
      session('race', 'a', [
        ['Bob', '1:09.900'],
        ['Ann', '1:09.800'],
        ['Cat', '1:10.000'],
      ]),
      session('race', 'b', [['Dan', '1:10.500']]),
    ]),
    event(2, [
      session('qualifications', 'a', [['Dan', '1:10.000']]),
      session('qualifications', 'b', [['Ann', '1:10.500']]),
      session('race', 'a', [['Dan', '1:10.000']]),
      session('race', 'b', [['Ann', '1:10.200']]),
    ]),
    event(3, [session('race', 'a', [['Bob', '1:10.000']])]),
    event(4, [session('race', 'a', [['Ann', '1:10.000']])], true),
  ])

  it('lists every completed round with overall quali position and race result', () => {
    const ann = computeDriverSeason(s, 'Ann')

    expect(ann.rounds).toEqual([
      {
        date: '2026-01-01',
        round: 'Race 1',
        qualiPosition: 1,
        qualiLap: '1:10.000',
        raceGroup: 'a',
        racePosition: 2,
        raceLap: '1:09.800',
        fastestLap: true,
      },
      {
        date: '2026-02-01',
        round: 'Race 2',
        qualiPosition: 2,
        qualiLap: '1:10.500',
        raceGroup: 'b',
        racePosition: 1,
        raceLap: '1:10.200',
        fastestLap: true,
      },
      {
        date: '2026-03-01',
        round: 'Race 3',
        qualiPosition: null,
        qualiLap: null,
        raceGroup: null,
        racePosition: null,
        raceLap: null,
        fastestLap: false,
      },
    ])
  })

  it('summarises the season, ranking a group A finish above a group B win', () => {
    const ann = computeDriverSeason(s, 'Ann')

    expect(ann.roundsRaced).toBe(2)
    expect(ann.wins).toBe(1)
    expect(ann.podiums).toBe(2)
    expect(ann.fastestLaps).toBe(2)
    expect(ann.bestFinish).toEqual({ group: 'a', position: 2 })
    expect(ann.bestQualiPosition).toBe(1)
  })

  it('returns an empty summary for a driver who did not race', () => {
    const zed = computeDriverSeason(s, 'Zed')

    expect(zed.roundsRaced).toBe(0)
    expect(zed.rounds).toHaveLength(3)
    expect(zed.bestFinish).toBeNull()
    expect(zed.bestQualiPosition).toBeNull()
  })
})
