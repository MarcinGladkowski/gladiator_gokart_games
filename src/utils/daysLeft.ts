export function daysLeft(isoDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const event = new Date(isoDate)
  event.setHours(0, 0, 0, 0)
  return Math.round((event.getTime() - today.getTime()) / 86_400_000)
}
