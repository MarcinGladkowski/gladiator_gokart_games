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
        { nickname: 'DRIVER1', position: 10, scorePercent: 70, racesCount: 10, raceScores: {} },
        { nickname: 'DRIVER2', position: 1, scorePercent: 80, racesCount: 10, raceScores: {} },
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
})
