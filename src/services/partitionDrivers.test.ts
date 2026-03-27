import { describe, it, expect } from 'vitest'
import { DriversGridService } from './partitionDrivers'
import type { Registration } from '../types'

const makeRegistration = (nickname: string, minsAgo: number): Registration => ({
  nickname,
  originalNickname: nickname,
  registrationDateTime: new Date(Date.now() - minsAgo * 60 * 1000),
})

describe('DriversGridService', () => {
  it('puts on-time registrations on the grid', () => {
    const enrollOpenDateTime = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    const service = new DriversGridService(26, enrollOpenDateTime, [])

    const registrations: Registration[] = [
      makeRegistration('KUBAG', 30), // 30 mins ago — on time
    ]

    const { grid, reserve } = service.partition(registrations)

    expect(grid).toHaveLength(1)
    expect(reserve).toHaveLength(0)
  })

  it('move drivers to reserve if there is no space on main grid', () => {
    const enrollOpenDateTime = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    const service = new DriversGridService(2, enrollOpenDateTime, [])

    const registrations: Registration[] = [
      makeRegistration('DRIVER1', 30),
      makeRegistration('DRIVER2', 30),
      makeRegistration('DRIVER3', 30),
    ]

    const { grid, reserve } = service.partition(registrations)

    expect(grid).toHaveLength(2)
    expect(reserve).toHaveLength(1)
  })

  it('puts late registrations on the reserve', () => {
    const enrollOpenDateTime = new Date(Date.now() - 60 * 60 * 25 * 1000) // 1 day ago + 1 hour
    const service = new DriversGridService(26, enrollOpenDateTime, [])

    const registrations: Registration[] = [
      makeRegistration('KUBAG', 30), // 30 mins ago — late
    ]

    const { grid, reserve } = service.partition(registrations)

    expect(grid).toHaveLength(0)
    expect(reserve).toHaveLength(1)
  })

  it('sort driver grid by position in league standings', () => {
    const enrollOpenDateTime = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    const service = new DriversGridService(
      26,
      enrollOpenDateTime,
      [
        { nickname: 'DRIVER1', position: 10, score: 0.70, entriesCount: 10, scores: [] },
        { nickname: 'DRIVER2', position: 1, score: 0.80, entriesCount: 10, scores: [] },
      ]
    )

    const registrations: Registration[] = [
      makeRegistration('DRIVER1', 30),
      makeRegistration('DRIVER2', 30),
    ]

    const { grid, reserve } = service.partition(registrations)

    expect(grid).toHaveLength(2)
    expect(grid[0].registration.nickname).toBe('DRIVER2')
    expect(grid[1].registration.nickname).toBe('DRIVER1')
    expect(reserve).toHaveLength(0)
  })

  it('sort driver grid by position in league standing and move driver for reserve list', () => {
    const enrollOpenDateTime = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    const service = new DriversGridService(
      2,
      enrollOpenDateTime,
      [
        { nickname: 'DRIVER1', position: 10, score: 0.70, entriesCount: 10, scores: [] },
        { nickname: 'DRIVER2', position: 1, score: 0.70, entriesCount: 10, scores: [] },
        { nickname: 'DRIVER3', position: 12, score: 0.80, entriesCount: 10, scores: [] },
      ]
    )

    const registrations: Registration[] = [
      makeRegistration('DRIVER1', 30),
      makeRegistration('DRIVER2', 30),
      makeRegistration('DRIVER3', 30),
    ]

    const { grid, reserve } = service.partition(registrations)

    expect(grid).toHaveLength(2)
    expect(grid[0].registration.nickname).toBe('DRIVER2')
    expect(grid[1].registration.nickname).toBe('DRIVER1')
    expect(reserve).toHaveLength(1)
    expect(reserve[0].registration.nickname).toBe('DRIVER3')
  })

  it('sort driver grid by position but put late registrations on reserve', () => {
    const enrollOpenDateTime = new Date(Date.now() - 60 * 60 * 25 * 1000) // 25 hours ago
    const service = new DriversGridService(
      2,
      enrollOpenDateTime,
      [
        { nickname: 'DRIVER1', position: 10, score: 0.70, entriesCount: 10, scores: [] },
        { nickname: 'DRIVER2', position: 1, score: 0.70, entriesCount: 10, scores: [] },
        { nickname: 'DRIVER3', position: 12, score: 0.80, entriesCount: 10, scores: [] },
      ]
    )

    const registrations: Registration[] = [
      makeRegistration('DRIVER1', 90), // on time
      makeRegistration('DRIVER2', 30), // late
      makeRegistration('DRIVER3', 90), // on time
    ]

    const { grid, reserve } = service.partition(registrations)

    expect(grid).toHaveLength(2)
    expect(grid[0].registration.nickname).toBe('DRIVER1')
    expect(grid[1].registration.nickname).toBe('DRIVER3')
    expect(reserve).toHaveLength(1)
    expect(reserve[0].registration.nickname).toBe('DRIVER2')
  })

  it('registered staff drivers in 24 hours window are prioritized and cannot be moved to reserve', () => {
    const enrollOpenDateTime = new Date(Date.now() - 60 * 60 * 25 * 1000) // 25 hours ago
    const service = new DriversGridService(
      2,
      enrollOpenDateTime,
      [
        { nickname: 'DRIVER1', position: 10, score: 0.70, entriesCount: 10, scores: [] },
        { nickname: 'DRIVER2', position: 1, score: 0.70, entriesCount: 10, scores: [] },
        { nickname: 'DRIVER3', position: 12, score: 0.80, entriesCount: 10, scores: [] },
        { nickname: 'HONKI', position: 11, score: 0.80, entriesCount: 10, scores: [] },
      ],
      ['Honki']
    )

    const registrations: Registration[] = [
      makeRegistration('DRIVER1', 90), // on time
      makeRegistration('DRIVER2', 30), // late
      makeRegistration('DRIVER3', 90), // on time
      makeRegistration('HONKI', 90), // on time
    ]

    const { grid, reserve } = service.partition(registrations)

    expect(grid).toHaveLength(2)
    expect(grid[0].registration.nickname).toBe('DRIVER1')
    expect(grid[1].registration.nickname).toBe('HONKI')
    expect(reserve).toHaveLength(2)
    expect(reserve[0].registration.nickname).toBe('DRIVER2')
    expect(reserve[1].registration.nickname).toBe('DRIVER3')
  })


  it('fill up starting grid with reserve drivers while is not full', () => {
    const enrollOpenDateTime = new Date(Date.now() - 60 * 60 * 25 * 1000) // 25 hours ago
    const service = new DriversGridService(
      4,
      enrollOpenDateTime,
      [
        { nickname: 'DRIVER1', position: 10, score: 0.70, entriesCount: 10, scores: [] },
        { nickname: 'DRIVER2', position: 1, score: 0.70, entriesCount: 10, scores: [] },
        { nickname: 'DRIVER3', position: 12, score: 0.80, entriesCount: 10, scores: [] },
        { nickname: 'HONKI', position: 11, score: 0.80, entriesCount: 10, scores: [] },
      ],
      ['Honki']
    )

    const registrations: Registration[] = [
      makeRegistration('DRIVER1', 90), // on time
      makeRegistration('DRIVER2', 30), // late
      makeRegistration('DRIVER3', 90), // on time
      makeRegistration('HONKI', 90), // on time
    ]

    const { grid, reserve } = service.partition(registrations)

    expect(grid).toHaveLength(3)
    expect(grid[0].registration.nickname).toBe('DRIVER1')
    expect(grid[1].registration.nickname).toBe('HONKI')
    expect(reserve).toHaveLength(1)
    expect(reserve[0].registration.nickname).toBe('DRIVER2')

  })
})
