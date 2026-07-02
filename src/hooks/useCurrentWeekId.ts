import { useState, useEffect } from 'preact/hooks'
import { getCurrentWeekId } from '../lib/week.ts'

/**
 * Reactive current ISO week id. Re-checks at an interval and when the tab
 * becomes visible again (covers phones waking after the Sun→Mon boundary),
 * so views roll over to the new week without a reload.
 */
export function useCurrentWeekId(): string {
  const [weekId, setWeekId] = useState(getCurrentWeekId)

  useEffect(() => {
    const check = () => setWeekId(getCurrentWeekId())
    const interval = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  return weekId
}
