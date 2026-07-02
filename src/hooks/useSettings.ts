import { useLiveQuery } from './useLiveQuery.ts'
import { db } from '../db/index.ts'
import type { AppSettings } from '../db/index.ts'
import { DEFAULT_SETTINGS } from '../db/settings.ts'

export function useSettings(): AppSettings {
  return useLiveQuery(
    async () => (await db.settings.get('settings')) ?? DEFAULT_SETTINGS,
    [],
    DEFAULT_SETTINGS,
  )
}
