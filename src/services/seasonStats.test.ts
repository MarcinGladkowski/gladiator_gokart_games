import { describe, it, expect } from 'vitest'
import { computeSeasonStats } from './seasonStats'
import type { RaceEvent, Season, Session } from '../types'

const race = (group: string, results: Array<[string, string]>): Session => ({
  group,
  type: 'race',
  entries: results.map(([driver, bestLap], i) => ({
    position: i + 1,
    kartNumber: i + 1,
    driver,
    laps: 10,
    gap: null,
    bestLap,
  })),
})

const quali = (group: string, results: Array<[string, string]>): Session => ({
  group,
  type: 'qualifications',
  entries: results.map(([driver, bestLap], i) => ({
    position: i + 1,
    kartNumber: i + 1,
    driver,
    laps: 5,
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

describe('computeSeasonStats', () => {
  it('counts wins and podiums per group and overall', () => {
    const facts = computeSeasonStats(
      season([
        event(1, [
          race('a', [['Ann', '1:10.000'], ['Bob', '1:10.100'], ['Cat', '1:10.200'], ['Dan', '1:10.300']]),
          race('b', [['Eve', '1:11.000'], ['Ann2', '1:11.100'], ['Fox', '1:11.200']]),
        ]),
        event(2, [race('b', [['Ann', '1:10.000'], ['Eve', '1:10.100'], ['Dan', '1:10.200']])]),
      ]),
    )

    expect(facts.racesCount).toBe(3)
    expect(facts.wins[0]).toEqual({ driver: 'Ann', count: 2 })
    expect(facts.podiums.find((t) => t.driver === 'Eve')?.count).toBe(2)
    expect(facts.podiums.find((t) => t.driver === 'Dan')?.count).toBe(1)
    expect(facts.distinctWinners).toBe(2)
  })

  it('restricts stats to a single group', () => {
    const s = season([
      event(1, [
        quali('a', [['Ann', '1:10.000'], ['Bob', '1:10.050']]),
        quali('b', [['Eve', '1:10.200'], ['Fox', '1:10.219']]),
        race('a', [['Ann', '1:10.000'], ['Bob', '1:10.100'], ['Eve', '1:10.200']]),
        race('b', [['Fox', '1:11.000'], ['Gus', '1:11.100']]),
      ]),
      event(2, [race('b', [['Ann', '1:10.000'], ['Fox', '1:10.100']])]),
    ])

    const a = computeSeasonStats(s, 'a')
    expect(a.racesCount).toBe(1)
    expect(a.wins).toEqual([{ driver: 'Ann', count: 1 }])
    expect(a.poles).toEqual([{ driver: 'Ann', count: 1 }])

    const b = computeSeasonStats(s, 'b')
    expect(b.racesCount).toBe(2)
    expect(b.wins).toEqual([{ driver: 'Ann', count: 1 }, { driver: 'Fox', count: 1 }])
    expect(b.fastestLaps).toEqual([{ driver: 'Ann', count: 1 }, { driver: 'Fox', count: 1 }])
    // group B pole sitter raced in group A — still found
    expect(b.poleConversions).toEqual([
      { round: 'Race 1', qualiGroup: 'b', driver: 'Eve', raceGroup: 'a', racePosition: 3 },
    ])
  })

  it('measures group pace against the fastest lap of that group', () => {
    const s = season(
      [1, 2, 3, 4].map((n) =>
        event(n, [
          race('a', [['Ann', '1:00.000'], ['Bob', '1:00.600']]),
          race('b', [['Cat', '1:01.000'], ['Dan', '1:01.610']]),
        ]),
      ),
    )

    const b = computeSeasonStats(s, 'b')
    expect(b.pace.map((p) => p.driver)).toEqual(['Cat', 'Dan'])
    expect(b.pace[1].avgGapPct).toBeCloseTo(1)
  })

  it('detects back-to-back winners across consecutive rounds only', () => {
    const facts = computeSeasonStats(
      season([
        event(1, [race('a', [['Ann', '1:10.000'], ['Bob', '1:10.100']])]),
        event(2, [race('a', [['Ann', '1:10.000'], ['Bob', '1:10.100']])]),
        event(3, [race('a', [['Bob', '1:10.000'], ['Ann', '1:10.100']])]),
        event(4, [race('a', [['Ann', '1:10.000'], ['Bob', '1:10.100']])]),
      ]),
    )

    expect(facts.backToBackWins).toEqual([{ driver: 'Ann', rounds: ['Race 1', 'Race 2'] }])
  })

  it('awards fastest lap per race and flags fastest laps without a podium', () => {
    const facts = computeSeasonStats(
      season([
        event(1, [
          race('a', [['Ann', '1:10.500'], ['Bob', '1:10.400'], ['Cat', '1:10.600'], ['Dan', '1:10.100']]),
          race('b', [['Eve', '1:11.000'], ['Fox', '1:11.100']]),
        ]),
      ]),
    )

    expect(facts.fastestLaps).toEqual([{ driver: 'Dan', count: 1 }, { driver: 'Eve', count: 1 }])
    expect(facts.fastestLapRaces).toEqual([
      { round: 'Race 1', group: 'a', driver: 'Dan', position: 4, bestLap: '1:10.100' },
      { round: 'Race 1', group: 'b', driver: 'Eve', position: 1, bestLap: '1:11.000' },
    ])
    expect(facts.fastestLapNoPodium).toEqual([
      { round: 'Race 1', group: 'a', driver: 'Dan', position: 4, bestLap: '1:10.100' },
    ])
  })

  it('ranks pace and consistency by % gap to the round fastest lap, ignoring layout changes', () => {
    const rounds = [
      // long layout
      ['1:40.000', '1:41.000', '1:42.000'],
      // short layout: same relative gaps for Bob, Cat drops further back
      ['50.000', '50.500', '52.000'],
      ['1:40.000', '1:41.000', '1:42.000'],
      ['1:40.000', '1:41.000', '1:42.000'],
    ]
    const facts = computeSeasonStats(
      season(
        rounds.map(([a, b, c], i) =>
          event(i + 1, [race('a', [['Ann', a], ['Bob', b], ['Cat', c]])]),
        ),
      ),
    )

    expect(facts.pace.map((p) => p.driver)).toEqual(['Ann', 'Bob', 'Cat'])
    expect(facts.pace[1].avgGapPct).toBeCloseTo(1)
    expect(facts.consistency[0].stdDevPct).toBeCloseTo(0)
    expect(facts.consistency.at(-1)?.driver).toBe('Cat')
  })

  it('leaves drivers with fewer than 4 rounds out of pace rankings', () => {
    const facts = computeSeasonStats(
      season([1, 2, 3].map((n) => event(n, [race('a', [['Ann', '1:10.000'], ['Bob', '1:11.000']])]))),
    )

    expect(facts.pace).toEqual([])
    expect(facts.improvement).toEqual([])
  })

  it('measures improvement as first two rounds vs last two rounds', () => {
    const gaps = ['1:43.000', '1:43.000', '1:41.000', '1:41.000']
    const facts = computeSeasonStats(
      season(gaps.map((bob, i) => event(i + 1, [race('a', [['Ann', '1:40.000'], ['Bob', bob]])]))),
    )

    const bob = facts.improvement.find((e) => e.driver === 'Bob')
    expect(bob?.startGapPct).toBeCloseTo(3)
    expect(bob?.endGapPct).toBeCloseTo(1)
    expect(bob?.improvementPct).toBeCloseTo(2)
    expect(facts.improvement[0].driver).toBe('Bob')
  })

  it('tracks poles, their race result in any group, and closest qualifying gaps', () => {
    const facts = computeSeasonStats(
      season([
        event(1, [
          quali('a', [['Ann', '1:10.000'], ['Bob', '1:10.050']]),
          quali('b', [['Cat', '1:10.200'], ['Dan', '1:10.219']]),
          race('a', [['Ann', '1:10.000'], ['Cat', '1:10.100'], ['Bob', '1:10.200']]),
          race('b', [['Dan', '1:11.000']]),
        ]),
      ]),
    )

    expect(facts.poles).toEqual([{ driver: 'Ann', count: 1 }, { driver: 'Cat', count: 1 }])
    expect(facts.poleConversions).toEqual([
      { round: 'Race 1', qualiGroup: 'a', driver: 'Ann', raceGroup: 'a', racePosition: 1 },
      { round: 'Race 1', qualiGroup: 'b', driver: 'Cat', raceGroup: 'a', racePosition: 2 },
    ])
    expect(facts.closestQualis.map((q) => q.gapMs)).toEqual([19, 50])
  })

  it('skips upcoming events', () => {
    const facts = computeSeasonStats(
      season([event(1, [race('a', [['Ann', '1:10.000']])]), event(2, [], true)]),
    )

    expect(facts.racesCount).toBe(1)
  })
})
