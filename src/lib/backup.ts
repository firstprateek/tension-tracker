import { db } from '../db/index.ts'
import type { TensionEvent, Person, WeeklyReview, AppSettings } from '../db/index.ts'

export interface BackupData {
  events?: TensionEvent[]
  persons?: Person[]
  reviews?: WeeklyReview[]
  settings?: AppSettings[]
  exportedAt?: string
}

export async function exportData(): Promise<BackupData> {
  return {
    events: await db.events.toArray(),
    persons: await db.persons.toArray(),
    reviews: await db.reviews.toArray(),
    settings: await db.settings.toArray(),
    exportedAt: new Date().toISOString(),
  }
}

/**
 * Restore a backup. Atomic: either every present table is replaced, or
 * (on failure) everything rolls back. bulkPut keeps restores idempotent
 * even if the file contains duplicate keys.
 */
export async function importData(data: BackupData): Promise<void> {
  await db.transaction('rw', [db.events, db.persons, db.reviews, db.settings], async () => {
    if (data.events) {
      await db.events.clear()
      await db.events.bulkPut(data.events)
    }
    if (data.persons) {
      await db.persons.clear()
      await db.persons.bulkPut(data.persons)
    }
    if (data.reviews) {
      await db.reviews.clear()
      await db.reviews.bulkPut(data.reviews)
    }
    if (data.settings) {
      await db.settings.clear()
      await db.settings.bulkPut(data.settings)
    }
  })
}
