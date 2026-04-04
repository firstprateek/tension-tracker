import Dexie, { type Table } from 'dexie'

export interface TensionEvent {
  id: string
  personId: string
  timestamp: number
  tags: string[]
  note: string
  weekId: string
}

export interface Person {
  id: string
  name: string
  color: string
  order: number
}

export interface WeeklyReview {
  weekId: string
  completedAt: number | null
  personSummaries: {
    personId: string
    totalEvents: number
    tensionPerHour: number
    topTags: { tag: string; count: number }[]
  }[]
  countermeasures: string
}

export interface AppSettings {
  key: string
  weekStartDay: number
  notificationsEnabled: boolean
  notificationDay: number
  notificationHour: number
  presetTags: string[]
}

class TensionDB extends Dexie {
  events!: Table<TensionEvent>
  persons!: Table<Person>
  reviews!: Table<WeeklyReview>
  settings!: Table<AppSettings>

  constructor() {
    super('tension-tracker')
    this.version(1).stores({
      events: 'id, personId, timestamp, weekId, *tags',
      persons: 'id, order',
      reviews: 'weekId',
      settings: 'key',
    })
  }
}

export const db = new TensionDB()
