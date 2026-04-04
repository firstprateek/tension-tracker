/**
 * Get ISO week ID string like "2026-W14" for a given date.
 */
export function getWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/**
 * Get the start (Monday 00:00) and end (Sunday 23:59:59.999) of an ISO week.
 */
export function getWeekBounds(weekId: string): { start: Date; end: Date } {
  const [yearStr, weekStr] = weekId.split('-W')
  const year = parseInt(yearStr, 10)
  const week = parseInt(weekStr, 10)

  // Jan 4 is always in week 1 of the ISO year
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7 // Mon=1 ... Sun=7
  const mondayOfWeek1 = new Date(jan4)
  mondayOfWeek1.setDate(jan4.getDate() - dayOfWeek + 1)

  const start = new Date(mondayOfWeek1)
  start.setDate(mondayOfWeek1.getDate() + (week - 1) * 7)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

/**
 * Get the current ISO week ID.
 */
export function getCurrentWeekId(): string {
  return getWeekId(new Date())
}

/**
 * Get the previous week's ID.
 */
export function getPreviousWeekId(weekId: string): string {
  const { start } = getWeekBounds(weekId)
  const prevDay = new Date(start)
  prevDay.setDate(prevDay.getDate() - 1)
  return getWeekId(prevDay)
}

/**
 * Get the next week's ID.
 */
export function getNextWeekId(weekId: string): string {
  const { end } = getWeekBounds(weekId)
  const nextDay = new Date(end)
  nextDay.setDate(nextDay.getDate() + 1)
  return getWeekId(nextDay)
}

/**
 * Format a week ID as a human-readable string like "Apr 1 – 7, 2026"
 */
export function formatWeekRange(weekId: string): string {
  const { start, end } = getWeekBounds(weekId)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const startMonth = monthNames[start.getMonth()]
  const endMonth = monthNames[end.getMonth()]

  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`
}
