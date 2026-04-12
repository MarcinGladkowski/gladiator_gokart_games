function timeUntil(dateStr: string): string {
  const now = new Date()
  const warsawNowStr = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now).replace(' ', 'T')
  const warsawNow = new Date(warsawNowStr)
  const target = new Date(`${dateStr}T18:00:00`)
  const diffMs = target.getTime() - warsawNow.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 24) return `${Math.max(1, Math.ceil(diffHours))}h`
  return `${Math.ceil(diffHours / 24)} days`
}

export function registrationOpenDate(raceDateStr: string): string {
  const d = new Date(`${raceDateStr}T18:00:00`)
  d.setDate(d.getDate() - 14)
  return d.toISOString().slice(0, 10)
}

function registrationStatus(raceDateStr: string): 'upcoming' | 'open' | 'closed' {
  const now = new Date()
  const warsawNowStr = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now).replace(' ', 'T')
  const warsawNow = new Date(warsawNowStr)
  const openDate = registrationOpenDate(raceDateStr)
  const openTime = new Date(`${openDate}T18:00:00`)
  const closeTime = new Date(openTime.getTime() + 24 * 60 * 60 * 1000)
  if (warsawNow < openTime) return 'upcoming'
  if (warsawNow < closeTime) return 'open'
  return 'closed'
}

export function RegistrationCountdown({ raceDate }: { raceDate: string }) {
  const openDate = registrationOpenDate(raceDate)
  const status = registrationStatus(raceDate)
  if (status === 'open') {
    return (
      <p className="text-sm text-green-400 font-medium">
        Registration is open
      </p>
    )
  }
  if (status === 'closed') {
    return (
      <p className="text-sm text-red-500">
        Registration closed (reserve list is open)
      </p>
    )
  }
  return (
    <p className="text-sm text-gray-400">
      Registration opens in <span className="text-white font-medium">{timeUntil(openDate)}</span> <span className="text-gray-600">at {openDate} at 18:00</span>
    </p>
  )
}
