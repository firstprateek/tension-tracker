import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './index.ts'
import { addEvent, updateEvent, getEventsForWeek, getAllEvents } from './events.ts'
import { ensureDefaultPerson, getPersons, addPerson, updatePerson, deletePerson } from './persons.ts'
import { ensureDefaultSettings, getSettings, updateSettings, DEFAULT_SETTINGS } from './settings.ts'
import { getReview, saveReview, getAllReviews } from './reviews.ts'
import { exportData, importData } from '../lib/backup.ts'
import { getCurrentWeekId } from '../lib/week.ts'

beforeEach(async () => {
  await Promise.all([db.events.clear(), db.persons.clear(), db.reviews.clear(), db.settings.clear()])
})

describe('seeding', () => {
  it('ensureDefaultPerson seeds exactly one person', async () => {
    await ensureDefaultPerson()
    const persons = await getPersons()
    expect(persons).toHaveLength(1)
    expect(persons[0]).toMatchObject({ id: 'default', name: 'Me' })
  })

  it('ensureDefaultPerson is idempotent under concurrent calls', async () => {
    await Promise.all([ensureDefaultPerson(), ensureDefaultPerson(), ensureDefaultPerson()])
    expect(await db.persons.count()).toBe(1)
  })

  it('ensureDefaultPerson does not overwrite an existing person', async () => {
    await db.persons.add({ id: 'custom', name: 'Alice', color: '#fff', order: 0 })
    await ensureDefaultPerson()
    expect(await db.persons.count()).toBe(1)
    expect((await getPersons())[0].name).toBe('Alice')
  })

  it('ensureDefaultSettings seeds defaults once and is idempotent', async () => {
    await Promise.all([ensureDefaultSettings(), ensureDefaultSettings()])
    expect(await db.settings.count()).toBe(1)
    const s = await getSettings()
    expect(s.presetTags).toEqual(DEFAULT_SETTINGS.presetTags)
  })

  it('ensureDefaultSettings preserves user-modified settings', async () => {
    await ensureDefaultSettings()
    await updateSettings({ presetTags: ['custom'] })
    await ensureDefaultSettings()
    expect((await getSettings()).presetTags).toEqual(['custom'])
  })
})

describe('events', () => {
  it('addEvent creates an event stamped with the current week', async () => {
    const id = await addEvent('default')
    const events = await getAllEvents()
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ id, personId: 'default', tags: [], note: '', weekId: getCurrentWeekId() })
    expect(events[0].timestamp).toBeGreaterThan(0)
  })

  it('updateEvent sets tags and note', async () => {
    const id = await addEvent('default')
    await updateEvent(id, { tags: ['work'], note: 'meeting ran over' })
    const [e] = await getAllEvents()
    expect(e.tags).toEqual(['work'])
    expect(e.note).toBe('meeting ran over')
  })

  it('getEventsForWeek only returns events in that week', async () => {
    await addEvent('default')
    await db.events.add({
      id: 'old', personId: 'default', timestamp: 0, tags: [], note: '', weekId: '2020-W01',
    })
    const thisWeek = await getEventsForWeek(getCurrentWeekId())
    expect(thisWeek).toHaveLength(1)
    expect(thisWeek[0].weekId).toBe(getCurrentWeekId())
  })
})

describe('persons', () => {
  it('addPerson assigns increasing order', async () => {
    await ensureDefaultPerson()
    await addPerson('Alex', '#4a9eff')
    await addPerson('Sam', '#4ade80')
    const persons = await getPersons()
    expect(persons.map((p) => p.order)).toEqual([0, 1, 2])
    expect(persons.map((p) => p.name)).toEqual(['Me', 'Alex', 'Sam'])
  })

  it('updatePerson renames without touching other fields', async () => {
    await ensureDefaultPerson()
    await updatePerson('default', { name: 'Padi' })
    const [p] = await getPersons()
    expect(p.name).toBe('Padi')
    expect(p.color).toBe('#e94560')
  })

  it('deletePerson cascades to their events and spares others', async () => {
    await ensureDefaultPerson()
    const otherId = await addPerson('Alex', '#4a9eff')
    await addEvent('default')
    await addEvent(otherId)
    await addEvent(otherId)

    await deletePerson(otherId)

    expect(await db.persons.count()).toBe(1)
    const events = await getAllEvents()
    expect(events).toHaveLength(1)
    expect(events[0].personId).toBe('default')
  })

  it('deletePerson refuses to delete the default person', async () => {
    await ensureDefaultPerson()
    await addEvent('default')
    await deletePerson('default')
    expect(await db.persons.count()).toBe(1)
    expect(await db.events.count()).toBe(1)
  })
})

describe('reviews', () => {
  const review = {
    weekId: '2026-W27',
    completedAt: 1_750_000_000_000,
    personSummaries: [
      { personId: 'default', totalEvents: 3, tensionPerHour: 0.02, topTags: [{ tag: 'work', count: 2 }] },
    ],
    countermeasures: 'Take walks after lunch',
  }

  it('saveReview + getReview round-trips by weekId', async () => {
    await saveReview(review)
    expect(await getReview('2026-W27')).toEqual(review)
  })

  it('saveReview overwrites the same week (put semantics)', async () => {
    await saveReview(review)
    await saveReview({ ...review, countermeasures: 'Updated plan' })
    expect(await getAllReviews()).toHaveLength(1)
    expect((await getReview('2026-W27'))?.countermeasures).toBe('Updated plan')
  })
})

describe('backup', () => {
  it('export → import round-trips all tables', async () => {
    await ensureDefaultPerson()
    await ensureDefaultSettings()
    const id = await addEvent('default')
    await updateEvent(id, { tags: ['work'], note: 'n' })
    await saveReview({
      weekId: '2026-W27', completedAt: 1, personSummaries: [], countermeasures: 'c',
    })

    const backup = await exportData()
    expect(backup.exportedAt).toBeTruthy()

    // Wipe, then restore.
    await Promise.all([db.events.clear(), db.persons.clear(), db.reviews.clear(), db.settings.clear()])
    await importData(backup)

    expect(await db.events.count()).toBe(1)
    expect(await db.persons.count()).toBe(1)
    expect(await db.reviews.count()).toBe(1)
    expect(await db.settings.count()).toBe(1)
    expect((await getAllEvents())[0].note).toBe('n')
  })

  it('import is idempotent — importing twice does not throw or duplicate', async () => {
    await ensureDefaultPerson()
    await addEvent('default')
    const backup = await exportData()
    await importData(backup)
    await importData(backup)
    expect(await db.events.count()).toBe(1)
    expect(await db.persons.count()).toBe(1)
  })

  it('import tolerates duplicate keys inside the backup file', async () => {
    const e = {
      id: 'dup', personId: 'default', timestamp: 1, tags: [], note: '', weekId: '2026-W01',
    }
    await importData({ events: [e, { ...e, note: 'second wins' }] })
    expect(await db.events.count()).toBe(1)
    expect((await getAllEvents())[0].note).toBe('second wins')
  })

  it('import only replaces tables present in the backup', async () => {
    await ensureDefaultPerson()
    await addEvent('default')
    await importData({ persons: [{ id: 'p2', name: 'Alex', color: '#fff', order: 0 }] })
    // Events untouched, persons replaced.
    expect(await db.events.count()).toBe(1)
    const persons = await getPersons()
    expect(persons).toHaveLength(1)
    expect(persons[0].id).toBe('p2')
  })
})
