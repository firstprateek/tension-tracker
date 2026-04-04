import { useState, useCallback } from 'preact/hooks'
import { Buzzer } from '../components/Buzzer.tsx'
import { TaggingModal } from './TaggingModal.tsx'
import { usePersons } from '../hooks/usePersons.ts'
import { useWeekEvents } from '../hooks/useWeekEvents.ts'
import { getCurrentWeekId } from '../lib/week.ts'
import { addEvent } from '../db/events.ts'
import styles from './BuzzerView.module.css'

export function BuzzerView() {
  const persons = usePersons()
  const weekId = getCurrentWeekId()
  const events = useWeekEvents(weekId)
  const [activeEventId, setActiveEventId] = useState<string | null>(null)

  const handlePress = useCallback(async (personId: string) => {
    const id = await addEvent(personId)
    setActiveEventId(id)
  }, [])

  const handleCloseModal = useCallback(() => {
    setActiveEventId(null)
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

      {activeEventId && <TaggingModal eventId={activeEventId} onClose={handleCloseModal} />}
    </div>
  )
}
