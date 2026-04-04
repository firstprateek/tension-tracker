import { useLiveQuery } from './useLiveQuery.ts'
import { db } from '../db/index.ts'
import type { AppSettings } from '../db/index.ts'

const DEFAULT_SETTINGS: AppSettings = {
  key: 'settings',
  weekStartDay: 1,
  notificationsEnabled: false,
  notificationDay: 0,
  notificationHour: 20,
  presetTags: ['work', 'family', 'health', 'money', 'social', 'other'],
}

export function useSettings(): AppSettings {
  return useLiveQuery(
    async () => (await db.settings.get('settings')) ?? DEFAULT_SETTINGS,
    [],
    DEFAULT_SETTINGS,
  )
}
