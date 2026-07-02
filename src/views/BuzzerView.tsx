import { useState, useCallback, useEffect, useRef } from 'preact/hooks'
import { Buzzer } from '../components/Buzzer.tsx'
import { TaggingModal } from './TaggingModal.tsx'
import { usePersons } from '../hooks/usePersons.ts'
import { useWeekEvents } from '../hooks/useWeekEvents.ts'
import { useCurrentWeekId } from '../hooks/useCurrentWeekId.ts'
import { addEvent, deleteEvent } from '../db/events.ts'
import styles from './BuzzerView.module.css'

const SNACKBAR_MS = 6_000

export function BuzzerView() {
  const persons = usePersons()
  const weekId = useCurrentWeekId()
  const events = useWeekEvents(weekId)
  // Logging is one tap: the event is saved immediately on press. The
  // snackbar then offers optional detail-tagging or undo, out of the way.
  const [lastLoggedId, setLastLoggedId] = useState<string | null>(null)
  const [detailsEventId, setDetailsEventId] = useState<string | null>(null)
  const snackbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasAnyEvents = events.length > 0

  useEffect(
    () => () => {
      if (snackbarTimer.current) clearTimeout(snackbarTimer.current)
    },
    [],
  )

  const dismissSnackbar = useCallback(() => {
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current)
    setLastLoggedId(null)
  }, [])

  const handlePress = useCallback(async (personId: string) => {
    const id = await addEvent(personId)
    setLastLoggedId(id)
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current)
    snackbarTimer.current = setTimeout(() => setLastLoggedId(null), SNACKBAR_MS)
  }, [])

  const handleUndo = useCallback(async () => {
    if (lastLoggedId) await deleteEvent(lastLoggedId)
    dismissSnackbar()
  }, [lastLoggedId, dismissSnackbar])

  const handleAddDetails = useCallback(() => {
    setDetailsEventId(lastLoggedId)
    dismissSnackbar()
  }, [lastLoggedId, dismissSnackbar])

  const handleCloseModal = useCallback(() => {
    setDetailsEventId(null)
  }, [])

  const isMulti = persons.length > 1

  return (
    <div class={styles.container}>
      {isMulti ? (
        <div class={styles.multiBuzzerRow}>
          {persons.map((person) => {
            const count = events.filter((e) => e.personId === person.id).length
            return (
              <div class={styles.personBuzzer} key={person.id}>
                <div class={styles.personLabel}>{person.name}</div>
                <Buzzer
                  color={person.color}
                  label={person.name}
                  count={count}
                  small
                  onPress={() => handlePress(person.id)}
                />
              </div>
            )
          })}
        </div>
      ) : (
        persons[0] && (
          <Buzzer
            color={persons[0].color}
            label={persons[0].name}
            count={events.length}
            onPress={() => handlePress(persons[0].id)}
          />
        )
      )}

      {!hasAnyEvents && !lastLoggedId && (
        <p class={styles.firstRunHint}>
          Feeling tension? Tap the buzzer to log it — one tap, done.
          <br />
          Review your patterns later in Stats.
        </p>
      )}

      {lastLoggedId && (
        <div class={styles.snackbar} role="status">
          <span class={styles.snackbarLabel}>Logged ✓</span>
          <button class={styles.snackbarBtn} onClick={handleAddDetails}>
            Add details
          </button>
          <button class={styles.snackbarBtn} onClick={handleUndo}>
            Undo
          </button>
        </div>
      )}

      {detailsEventId && <TaggingModal eventId={detailsEventId} onClose={handleCloseModal} />}
    </div>
  )
}
