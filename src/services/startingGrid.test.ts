import { describe, it, expect } from 'vitest'
import { buildStartingGrid } from './startingGrid'
import type { Session } from '../types'

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

const names = (slots: Array<{ driver: string }>) => slots.map((s) => s.driver)

describe('buildStartingGrid', () => {
  it('ranks both qualifying groups together by best lap and splits them into race groups', () => {
    const grid = buildStartingGrid(
      [
        quali('a', [['A1', '1:11.000'], ['A2', '1:11.500'], ['A3', '1:13.000']]),
        quali('b', [['B1', '1:11.200'], ['B2', '1:12.000'], ['B3', '1:14.000']]),
      ],
      3,
    )

    expect(names(grid!.a)).toEqual(['A1', 'B1', 'A2'])
    expect(names(grid!.b)).toEqual(['B2', 'A3', 'B3'])
    expect(grid!.a.map((s) => s.position)).toEqual([1, 2, 3])
    expect(grid!.b.map((s) => s.position)).toEqual([1, 2, 3])
    expect(grid!.a[1]).toMatchObject({ qualiGroup: 'b', qualiPosition: 1, bestLap: '1:11.200' })
  })

  it('compares lap times with and without minutes', () => {
    const grid = buildStartingGrid(
      [quali('a', [['SLOW', '1:00.141']]), quali('b', [['FAST', '59.994']])],
      1,
    )

    expect(names(grid!.a)).toEqual(['FAST'])
    expect(names(grid!.b)).toEqual(['SLOW'])
  })

  it('puts drivers without a lap time at the back', () => {
    const grid = buildStartingGrid(
      [quali('a', [['NO TIME', ''], ['A2', '1:12.000']]), quali('b', [['B1', '1:11.000']])],
      2,
    )

    expect(names(grid!.a)).toEqual(['B1', 'A2'])
    expect(names(grid!.b)).toEqual(['NO TIME'])
  })

  it('returns null when the event lacks qualifications for both groups', () => {
    expect(buildStartingGrid([quali('a', [['A1', '1:11.000']])])).toBeNull()
  })
})
