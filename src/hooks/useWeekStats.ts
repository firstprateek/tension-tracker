import { useMemo } from 'preact/hooks'
import type { TensionEvent } from '../db/index.ts'
import { getWeekBounds } from '../lib/week.ts'

export interface DayCount {
  day: string
  count: number
  dayIndex: number
}

export interface TagCount {
  tag: string
  count: number
}

export interface PersonStats {
  personId: string
  totalEvents: number
  tensionPerHour: number
  dailyCounts: DayCount[]
  tagCounts: TagCount[]
}

export interface WeekStats {
  totalEvents: number
  tensionPerHour: number
  dailyCounts: DayCount[]
  tagCounts: TagCount[]
  perPerson: PersonStats[]
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function useWeekStats(events: TensionEvent[], weekId: string): WeekStats {
  return useMemo(() => computeWeekStats(events, weekId), [events, weekId])
}

export function computeWeekStats(events: TensionEvent[], weekId: string): WeekStats {
  const { start, end } = getWeekBounds(weekId)
  const now = new Date()
  const effectiveEnd = now < end ? now : end
  const hoursElapsed = Math.max(1, (effectiveEnd.getTime() - start.getTime()) / 3600000)

  const totalEvents = events.length
  const tensionPerHour = totalEvents / hoursElapsed

  // Daily counts
  const dailyMap = new Map<number, number>()
  for (const e of events) {
    const d = new Date(e.timestamp)
    const dayIndex = (d.getDay() + 6) % 7 // Mon=0 ... Sun=6
    dailyMap.set(dayIndex, (dailyMap.get(dayIndex) ?? 0) + 1)
  }
  const dailyCounts: DayCount[] = DAY_NAMES.map((day, i) => ({
    day,
    count: dailyMap.get(i) ?? 0,
    dayIndex: i,
  }))

  // Tag counts
  const tagMap = new Map<string, number>()
  for (const e of events) {
    for (const tag of e.tags) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1)
    }
  }
  const tagCounts: TagCount[] = Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)

  // Per-person stats
  const personMap = new Map<string, TensionEvent[]>()
  for (const e of events) {
    const arr = personMap.get(e.personId) ?? []
    arr.push(e)
    personMap.set(e.personId, arr)
  }
  const perPerson: PersonStats[] = Array.from(personMap.entries()).map(([personId, personEvents]) => {
    const pDailyMap = new Map<number, number>()
    const pTagMap = new Map<string, number>()
    for (const e of personEvents) {
      const d = new Date(e.timestamp)
      const dayIndex = (d.getDay() + 6) % 7
      pDailyMap.set(dayIndex, (pDailyMap.get(dayIndex) ?? 0) + 1)
      for (const tag of e.tags) {
        pTagMap.set(tag, (pTagMap.get(tag) ?? 0) + 1)
      }
    }
    return {
      personId,
      totalEvents: personEvents.length,
      tensionPerHour: personEvents.length / hoursElapsed,
      dailyCounts: DAY_NAMES.map((day, i) => ({ day, count: pDailyMap.get(i) ?? 0, dayIndex: i })),
      tagCounts: Array.from(pTagMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count),
    }
  })

  return { totalEvents, tensionPerHour, dailyCounts, tagCounts, perPerson }
}
