import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { computeWeekStats } from './useWeekStats.ts'
import { getWeekBounds } from '../lib/week.ts'
import type { TensionEvent } from '../db/index.ts'

function makeEvent(overrides: Partial<TensionEvent>): TensionEvent {
  return {
    id: crypto.randomUUID(),
    personId: 'default',
    timestamp: Date.now(),
    tags: [],
    note: '',
    weekId: '2026-W25',
    ...overrides,
  }
}

// 2026-W25 = Mon Jun 15 – Sun Jun 21, 2026 (local time)
const WEEK = '2026-W25'
const weekStart = () => getWeekBounds(WEEK).start.getTime()

afterEach(() => {
  vi.useRealTimers()
})

describe('computeWeekStats — denominators', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('uses exactly 168h for completed weeks', () => {
    vi.setSystemTime(new Date(2026, 7, 1)) // Aug 2026, well after W25
    const events = Array.from({ length: 168 }, () => makeEvent({ timestamp: weekStart() + 1000 }))
    const stats = computeWeekStats(events, WEEK)
    expect(stats.tensionPerHour).toBe(1)
  })

  it('uses exactly 168h even for DST-transition weeks', () => {
    vi.setSystemTime(new Date(2026, 7, 1))
    // 2026-W10 (Mar 2–8) contains the US spring-forward on Mar 8.
    const events = Array.from({ length: 168 }, () => makeEvent({ weekId: '2026-W10', timestamp: new Date(2026, 2, 3).getTime() }))
    expect(computeWeekStats(events, '2026-W10').tensionPerHour).toBe(1)
  })

  it('uses hours elapsed so far for the in-progress week', () => {
    // Wednesday 12:00 of W25 → 60h elapsed since Monday 00:00.
    vi.setSystemTime(new Date(2026, 5, 17, 12, 0, 0))
    const events = Array.from({ length: 30 }, () => makeEvent({ timestamp: weekStart() + 1000 }))
    const stats = computeWeekStats(events, WEEK)
    expect(stats.tensionPerHour).toBeCloseTo(0.5, 5)
  })

  it('clamps the denominator to at least 1h (future weeks / week start)', () => {
    vi.setSystemTime(new Date(2026, 0, 1))
    const stats = computeWeekStats([makeEvent({})], WEEK)
    expect(stats.tensionPerHour).toBe(1) // 1 event / max(1h)
    expect(Number.isFinite(stats.tensionPerHour)).toBe(true)
  })

  it('returns zeroes for an empty week', () => {
    vi.setSystemTime(new Date(2026, 7, 1))
    const stats = computeWeekStats([], WEEK)
    expect(stats.totalEvents).toBe(0)
    expect(stats.tensionPerHour).toBe(0)
    expect(stats.dailyCounts.every((d) => d.count === 0)).toBe(true)
    expect(stats.tagCounts).toEqual([])
    expect(stats.perPerson).toEqual([])
  })
})

describe('computeWeekStats — bucketing and aggregation', () => {
  it('buckets events into Mon..Sun day slots', () => {
    const start = weekStart()
    const events = [
      makeEvent({ timestamp: start + 10 * 3600_000 }), // Mon
      makeEvent({ timestamp: start + 10 * 3600_000 }), // Mon
      makeEvent({ timestamp: start + (2 * 24 + 10) * 3600_000 }), // Wed
      makeEvent({ timestamp: start + (6 * 24 + 10) * 3600_000 }), // Sun
    ]
    const { dailyCounts } = computeWeekStats(events, WEEK)
    expect(dailyCounts.map((d) => d.day)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(dailyCounts.map((d) => d.count)).toEqual([2, 0, 1, 0, 0, 0, 1])
  })

  it('counts and sorts tags by frequency', () => {
    const events = [
      makeEvent({ tags: ['work'] }),
      makeEvent({ tags: ['work', 'money'] }),
      makeEvent({ tags: ['family'] }),
      makeEvent({ tags: ['work'] }),
    ]
    const { tagCounts } = computeWeekStats(events, WEEK)
    expect(tagCounts[0]).toEqual({ tag: 'work', count: 3 })
    expect(tagCounts).toHaveLength(3)
    const counts = tagCounts.map((t) => t.count)
    expect(counts).toEqual([...counts].sort((a, b) => b - a))
  })

  it('splits stats per person', () => {
    const events = [
      makeEvent({ personId: 'a', tags: ['work'] }),
      makeEvent({ personId: 'a' }),
      makeEvent({ personId: 'b', tags: ['family'] }),
    ]
    const { perPerson, totalEvents } = computeWeekStats(events, WEEK)
    expect(totalEvents).toBe(3)
    expect(perPerson).toHaveLength(2)
    const a = perPerson.find((p) => p.personId === 'a')!
    const b = perPerson.find((p) => p.personId === 'b')!
    expect(a.totalEvents).toBe(2)
    expect(a.tagCounts).toEqual([{ tag: 'work', count: 1 }])
    expect(b.totalEvents).toBe(1)
    expect(b.tagCounts).toEqual([{ tag: 'family', count: 1 }])
  })
})
