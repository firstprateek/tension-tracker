import { useLiveQuery } from '../hooks/useLiveQuery.ts'
import { db } from '../db/index.ts'

export function usePersons() {
  return useLiveQuery(() => db.persons.orderBy('order').toArray(), [], [])
}
