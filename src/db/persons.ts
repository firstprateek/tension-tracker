import { db } from './index.ts'
import type { Person } from './index.ts'

const DEFAULT_PERSON: Person = {
  id: 'default',
  name: 'Me',
  color: '#e94560',
  order: 0,
}

export async function ensureDefaultPerson(): Promise<void> {
  const count = await db.persons.count()
  if (count === 0) {
    await db.persons.add(DEFAULT_PERSON)
  }
}

export async function getPersons(): Promise<Person[]> {
  return db.persons.orderBy('order').toArray()
}

export async function addPerson(name: string, color: string): Promise<string> {
  const maxOrder = await db.persons.orderBy('order').last()
  const order = (maxOrder?.order ?? -1) + 1
  const id = crypto.randomUUID()
  await db.persons.add({ id, name, color, order })
  return id
}

export async function updatePerson(id: string, updates: Partial<Pick<Person, 'name' | 'color'>>): Promise<void> {
  await db.persons.update(id, updates)
}

export async function deletePerson(id: string): Promise<void> {
  if (id === 'default') return
  await db.persons.delete(id)
  await db.events.where('personId').equals(id).delete()
}
