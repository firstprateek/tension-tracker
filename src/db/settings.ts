import { db } from './index.ts'
import type { AppSettings } from './index.ts'

export const DEFAULT_SETTINGS: AppSettings = {
  key: 'settings',
  notificationDay: 0,
  notificationHour: 20,
  presetTags: ['work', 'family', 'health', 'money', 'social', 'other'],
}

export async function ensureDefaultSettings(): Promise<void> {
  // Check-then-add inside a transaction so re-entrant mounts can't double-seed.
  await db.transaction('rw', db.settings, async () => {
    const existing = await db.settings.get('settings')
    if (!existing) {
      await db.settings.add(DEFAULT_SETTINGS)
    }
  })
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get('settings')
  return settings ?? DEFAULT_SETTINGS
}

export async function updateSettings(updates: Partial<Omit<AppSettings, 'key'>>): Promise<void> {
  await db.settings.update('settings', updates)
}
