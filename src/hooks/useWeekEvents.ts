import { useLiveQuery } from './useLiveQuery.ts'
import { db } from '../db/index.ts'
import type { TensionEvent } from '../db/index.ts'

export function useWeekEvents(weekId: string): TensionEvent[] {
  return useLiveQuery(
    () => db.events.where('weekId').equals(weekId).toArray(),
    [weekId],
    [],
  )
}
