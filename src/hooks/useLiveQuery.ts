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
  const defaultRef = useRef(defaultValue)
  defaultRef.current = defaultValue

  useEffect(() => {
    let cancelled = false
    // Deps changed: drop the previous subscription's data immediately so
    // views never render the old query's rows while the new one resolves.
    setValue(defaultRef.current)
    const observable = liveQuery(() => querierRef.current()) as Observable<T>
    const subscription = observable.subscribe({
      next: (val) => {
        if (!cancelled) setValue(val)
      },
      error: (err) => console.error('LiveQuery error:', err),
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, deps)

  return value
}
