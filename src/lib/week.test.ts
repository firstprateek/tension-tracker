import { describe, it, expect } from 'vitest'
import {
  getWeekId,
  getWeekBounds,
  getCurrentWeekId,
  getPreviousWeekId,
  getNextWeekId,
  formatWeekRange,
  weeksInISOYear,
} from './week.ts'

describe('getWeekId', () => {
  it('computes ISO week for a mid-year date', () => {
    // 2026-04-01 is a Wednesday in ISO week 14.
    expect(getWeekId(new Date(2026, 3, 1))).toBe('2026-W14')
  })

  it('assigns early January to the previous ISO year when appropriate', () => {
    // Jan 1 2021 was a Friday — it belongs to 2020-W53.
    expect(getWeekId(new Date(2021, 0, 1))).toBe('2020-W53')
  })

  it('assigns late December to the next ISO year when appropriate', () => {
    // Mon Dec 29 2025 starts ISO week 1 of 2026.
    expect(getWeekId(new Date(2025, 11, 29))).toBe('2026-W01')
    expect(getWeekId(new Date(2026, 0, 1))).toBe('2026-W01')
  })

  it('pads single-digit weeks', () => {
    expect(getWeekId(new Date(2026, 0, 10))).toBe('2026-W02')
  })
})

describe('weeksInISOYear', () => {
  it('knows 53-week years', () => {
    expect(weeksInISOYear(2020)).toBe(53)
    expect(weeksInISOYear(2026)).toBe(53)
  })
  it('knows 52-week years', () => {
    expect(weeksInISOYear(2021)).toBe(52)
    expect(weeksInISOYear(2025)).toBe(52)
  })
})

describe('getWeekBounds', () => {
  it('returns Monday 00:00 through Sunday 23:59:59.999', () => {
    const { start, end } = getWeekBounds('2026-W15')
    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(3)
    expect(start.getDate()).toBe(6)
    expect(start.getDay()).toBe(1) // Monday
    expect(start.getHours()).toBe(0)
    expect(end.getDate()).toBe(12)
    expect(end.getDay()).toBe(0) // Sunday
    expect(end.getHours()).toBe(23)
    expect(end.getMilliseconds()).toBe(999)
  })

  it('handles week 1 spanning the year boundary', () => {
    const { start, end } = getWeekBounds('2026-W01')
    expect(start.getFullYear()).toBe(2025)
    expect(start.getMonth()).toBe(11)
    expect(start.getDate()).toBe(29)
    expect(end.getFullYear()).toBe(2026)
    expect(end.getDate()).toBe(4)
  })

  it('round-trips with getWeekId across many weeks', () => {
    let weekId = '2024-W48'
    for (let i = 0; i < 60; i++) {
      const { start, end } = getWeekBounds(weekId)
      expect(getWeekId(start)).toBe(weekId)
      expect(getWeekId(end)).toBe(weekId)
      weekId = getNextWeekId(weekId)
    }
  })

  it('clamps out-of-range week numbers instead of fabricating dates', () => {
    expect(getWeekBounds('2025-W60')).toEqual(getWeekBounds('2025-W52'))
    expect(getWeekBounds('2025-W00')).toEqual(getWeekBounds('2025-W01'))
  })

  it('falls back to the current week for unparsable ids', () => {
    const { start } = getWeekBounds('garbage')
    expect(Number.isNaN(start.getTime())).toBe(false)
    expect(getWeekId(start)).toBe(getCurrentWeekId())
  })
})

describe('week navigation', () => {
  it('moves forward through a 53-week year', () => {
    expect(getNextWeekId('2020-W52')).toBe('2020-W53')
    expect(getNextWeekId('2020-W53')).toBe('2021-W01')
  })

  it('moves backward across year boundaries', () => {
    expect(getPreviousWeekId('2021-W01')).toBe('2020-W53')
    expect(getPreviousWeekId('2026-W01')).toBe('2025-W52')
  })

  it('prev and next are inverses', () => {
    for (const id of ['2026-W01', '2026-W27', '2020-W53', '2025-W52']) {
      expect(getPreviousWeekId(getNextWeekId(id))).toBe(id)
      expect(getNextWeekId(getPreviousWeekId(id))).toBe(id)
    }
  })
})

describe('formatWeekRange', () => {
  it('formats a same-month week', () => {
    expect(formatWeekRange('2026-W15')).toBe('Apr 6 – 12, 2026')
  })

  it('formats a cross-month week', () => {
    expect(formatWeekRange('2026-W14')).toBe('Mar 30 – Apr 5, 2026')
  })

  it('formats a cross-year week with both years', () => {
    expect(formatWeekRange('2026-W01')).toBe('Dec 29, 2025 – Jan 4, 2026')
  })
})
