import { describe, it, expect } from 'vitest'
import { getWeekId } from '../lib/week.ts'

// Minimal harness sanity check — replaced by full suites once fixes land.
describe('test harness', () => {
  it('runs and can import app code', () => {
    // 2026-04-01 is a Wednesday, ISO week 14.
    expect(getWeekId(new Date(2026, 3, 1))).toBe('2026-W14')
  })

  it('has fake-indexeddb available', () => {
    expect(typeof indexedDB).toBe('object')
  })
})
