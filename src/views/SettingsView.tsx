import { useState, useCallback } from 'preact/hooks'
import { usePersons } from '../hooks/usePersons.ts'
import { useSettings } from '../hooks/useSettings.ts'
import { addPerson, updatePerson, deletePerson } from '../db/persons.ts'
import { updateSettings } from '../db/settings.ts'
import { db } from '../db/index.ts'
import type { TensionEvent, Person, WeeklyReview, AppSettings } from '../db/index.ts'
import styles from './SettingsView.module.css'

const PERSON_COLORS = ['#e94560', '#4a9eff', '#4ade80', '#fbbf24']

export function SettingsView() {
  const persons = usePersons()
  const settings = useSettings()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newTag, setNewTag] = useState('')

  const handleAddPerson = useCallback(async () => {
    if (persons.length >= 4) return
    const color = PERSON_COLORS[persons.length] ?? PERSON_COLORS[0]
    await addPerson('Person', color)
  }, [persons.length])

  const handleStartEdit = useCallback((person: Person) => {
    setEditingId(person.id)
    setEditName(person.name)
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (editingId && editName.trim()) {
      await updatePerson(editingId, { name: editName.trim() })
    }
    setEditingId(null)
  }, [editingId, editName])

  const handleDeletePerson = useCallback(async (id: string) => {
    if (id === 'default') return
    await deletePerson(id)
  }, [])

  const handleRemoveTag = useCallback(
    async (tag: string) => {
      await updateSettings({ presetTags: settings.presetTags.filter((t) => t !== tag) })
    },
    [settings.presetTags],
  )

  const handleAddTag = useCallback(async () => {
    const trimmed = newTag.trim().toLowerCase()
    if (trimmed && !settings.presetTags.includes(trimmed)) {
      await updateSettings({ presetTags: [...settings.presetTags, trimmed] })
    }
    setNewTag('')
  }, [newTag, settings.presetTags])

  const handleExport = useCallback(async () => {
    const data = {
      events: await db.events.toArray(),
      persons: await db.persons.toArray(),
      reviews: await db.reviews.toArray(),
      settings: await db.settings.toArray(),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tension-tracker-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text) as {
          events?: TensionEvent[]
          persons?: Person[]
          reviews?: WeeklyReview[]
          settings?: AppSettings[]
        }
        await db.transaction('rw', [db.events, db.persons, db.reviews, db.settings], async () => {
          if (data.events) {
            await db.events.clear()
            await db.events.bulkAdd(data.events)
          }
          if (data.persons) {
            await db.persons.clear()
            await db.persons.bulkAdd(data.persons)
          }
          if (data.reviews) {
            await db.reviews.clear()
            await db.reviews.bulkAdd(data.reviews)
          }
          if (data.settings) {
            await db.settings.clear()
            await db.settings.bulkAdd(data.settings)
          }
        })
        alert('Data imported successfully!')
      } catch {
        alert('Failed to import data. Please check the file format.')
      }
    }
    input.click()
  }, [])

  const handleClearAll = useCallback(async () => {
    if (!confirm('This will delete ALL your tension data. Are you sure?')) return
    await db.transaction('rw', [db.events, db.persons, db.reviews, db.settings], async () => {
      await db.events.clear()
      await db.reviews.clear()
    })
    alert('All tension data cleared.')
  }, [])

  const handleDownloadIcs = useCallback(() => {
    const day = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][settings.notificationDay] ?? 'SU'
    const hour = String(settings.notificationHour).padStart(2, '0')
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tension Tracker//EN',
      'BEGIN:VEVENT',
      'DTSTART:20260101T' + hour + '0000',
      'RRULE:FREQ=WEEKLY;BYDAY=' + day,
      'DURATION:PT30M',
      'SUMMARY:Weekly Tension Review',
      'DESCRIPTION:Time to review your tension patterns and plan countermeasures.',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tension-review.ics'
    a.click()
    URL.revokeObjectURL(url)
  }, [settings.notificationDay, settings.notificationHour])

  return (
    <div class={styles.container}>
      <div class={styles.title}>Settings</div>

      <div class={styles.section}>
        <div class={styles.sectionTitle}>People</div>
        {persons.map((person) => (
          <div class={styles.personRow} key={person.id}>
            <div class={styles.personColor} style={{ backgroundColor: person.color }} />
            {editingId === person.id ? (
              <>
                <input
                  class={styles.personInput}
                  value={editName}
                  onInput={(e) => setEditName((e.target as HTMLInputElement).value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  autofocus
                />
                <button class={styles.iconBtn} onClick={handleSaveEdit}>
                  &#10003;
                </button>
              </>
            ) : (
              <>
                <span class={styles.personName}>{person.name}</span>
                <button class={styles.iconBtn} onClick={() => handleStartEdit(person)}>
                  &#9998;
                </button>
                {person.id !== 'default' && (
                  <button class={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => handleDeletePerson(person.id)}>
                    &#10005;
                  </button>
                )}
              </>
            )}
          </div>
        ))}
        {persons.length < 4 && (
          <button class={styles.addBtn} onClick={handleAddPerson}>
            + Add person
          </button>
        )}
      </div>

      <div class={styles.section}>
        <div class={styles.sectionTitle}>Tags</div>
        <div class={styles.tagList}>
          {settings.presetTags.map((tag) => (
            <span class={styles.tag} key={tag}>
              {tag}
              <button class={styles.tagRemove} onClick={() => handleRemoveTag(tag)}>
                &#10005;
              </button>
            </span>
          ))}
        </div>
        <div class={styles.addTagRow}>
          <input
            class={styles.addTagInput}
            placeholder="Add tag..."
            value={newTag}
            onInput={(e) => setNewTag((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          />
          {newTag.trim() && (
            <button class={styles.addTagSubmit} onClick={handleAddTag}>
              Add
            </button>
          )}
        </div>
      </div>

      <div class={styles.section}>
        <div class={styles.sectionTitle}>Reminders</div>
        <button class={styles.actionBtn} onClick={handleDownloadIcs}>
          Add to Calendar
        </button>
      </div>

      <div class={styles.section}>
        <div class={styles.sectionTitle}>Data</div>
        <button class={styles.actionBtn} onClick={handleExport}>
          Export JSON
        </button>
        <button class={styles.actionBtn} onClick={handleImport}>
          Import JSON
        </button>
        <button class={`${styles.actionBtn} ${styles.dangerBtn}`} onClick={handleClearAll}>
          Clear All Data
        </button>
      </div>

      <div class={styles.version}>Tension Tracker v0.0.1</div>
    </div>
  )
}
