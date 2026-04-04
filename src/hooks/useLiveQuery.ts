import { useState, useEffect, useRef } from 'preact/hooks'
import { liveQuery, type Observable } from 'dexie'

export function useLiveQuery<T>(
  querier: () => T | Promise<T>,
  deps: unknown[],
  defaultValue: T,
): T {
  const [value, setValue] = useState<T>(defaultValue)
  const querierRef = useRef(querier)
  querierRef.current = querier

  useEffect(() => {
    const observable = liveQuery(() => querierRef.current()) as Observable<T>
    const subscription = observable.subscribe({
      next: (val) => setValue(val),
      error: (err) => console.error('LiveQuery error:', err),
    })
    return () => subscription.unsubscribe()
  }, deps)

  return value
}
