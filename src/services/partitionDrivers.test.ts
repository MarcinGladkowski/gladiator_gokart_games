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
    const service = new DriversGridService([], 26, enrollOpenDateTime, [])

    const registrations: Registration[] = [
      makeRegistration('KUBAG', 30), // 30 mins ago — on time
    ]

    const { grid, reserve } = service.partition(registrations)

    expect(grid).toHaveLength(1)
    expect(reserve).toHaveLength(0)
  })

  it('puts late registrations on the reserve', () => {
    const enrollOpenDateTime = new Date(Date.now() - 60 * 60 * 25 * 1000) // 1 day ago
    const service = new DriversGridService([], 26, enrollOpenDateTime, [])

    const registrations: Registration[] = [
      makeRegistration('KUBAG', 30), // 30 mins ago — on time
    ]

    const { grid, reserve } = service.partition(registrations)

    expect(grid).toHaveLength(0)
    expect(reserve).toHaveLength(1)
  })
})
