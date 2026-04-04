import { db } from './index.ts'
import type { TensionEvent } from './index.ts'
import { getWeekId } from '../lib/week.ts'

export async function addEvent(personId: string): Promise<string> {
  const now = Date.now()
  const id = crypto.randomUUID()
  const event: TensionEvent = {
    id,
    personId,
    timestamp: now,
    tags: [],
    note: '',
    weekId: getWeekId(new Date(now)),
  }
  await db.events.add(event)
  return id
}

export async function updateEvent(id: string, updates: Partial<Pick<TensionEvent, 'tags' | 'note'>>): Promise<void> {
  await db.events.update(id, updates)
}

export async function getEventsForWeek(weekId: string): Promise<TensionEvent[]> {
  return db.events.where('weekId').equals(weekId).toArray()
}

export async function getEventCountForWeek(weekId: string, personId?: string): Promise<number> {
  let collection = db.events.where('weekId').equals(weekId)
  if (personId) {
    const events = await collection.toArray()
    return events.filter(e => e.personId === personId).length
  }
  return collection.count()
}

export async function getAllEvents(): Promise<TensionEvent[]> {
  return db.events.orderBy('timestamp').toArray()
}

export async function deleteAllEvents(): Promise<void> {
  await db.events.clear()
}
