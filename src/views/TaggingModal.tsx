import { useState, useCallback, useEffect, useRef } from 'preact/hooks'
import { TagPicker } from '../components/TagPicker.tsx'
import { updateEvent } from '../db/events.ts'
import { updateSettings } from '../db/settings.ts'
import { useSettings } from '../hooks/useSettings.ts'
import styles from './TaggingModal.module.css'

interface TaggingModalProps {
  eventId: string
  onClose: () => void
}

const AUTO_DISMISS_MS = 30_000

export function TaggingModal({ eventId, onClose }: TaggingModalProps) {
  const settings = useSettings()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [note, setNote] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const closedRef = useRef(false)

  // Latest selections, readable from timers without re-arming them.
  const selectionRef = useRef({ tags: selectedTags, note })
  selectionRef.current = { tags: selectedTags, note }

  // Every close path commits — overlay tap, Escape, auto-dismiss, Done.
  // Selections are never silently discarded.
  const commitAndClose = useCallback(async () => {
    if (closedRef.current) return
    closedRef.current = true
    const { tags, note } = selectionRef.current
    try {
      await updateEvent(eventId, { tags, note: note.trim() })
    } finally {
      onClose()
    }
  }, [eventId, onClose])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(commitAndClose, AUTO_DISMISS_MS)
  }, [commitAndClose])

  useEffect(() => {
    resetTimer()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [resetTimer])

  // Move focus into the dialog on open; restore it on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    sheetRef.current?.focus()
    return () => previous?.focus?.()
  }, [])

  // Escape commits and closes; Tab cycles within the sheet.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        commitAndClose()
        return
      }
      if (e.key === 'Tab' && sheetRef.current) {
        const focusables = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, input, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [commitAndClose])

  const handleActivity = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  const handleToggleTag = useCallback(
    (tag: string) => {
      handleActivity()
      setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
    },
    [handleActivity],
  )

  const handleAddCustomTag = useCallback(
    (tag: string) => {
      handleActivity()
      if (!settings.presetTags.includes(tag)) {
        updateSettings({ presetTags: [...settings.presetTags, tag] })
      }
    },
    [handleActivity, settings.presetTags],
  )

  return (
    <div class={styles.overlay} onClick={commitAndClose}>
      <div
        ref={sheetRef}
        class={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tagging-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handleActivity}
        onKeyDown={handleActivity}
      >
        <div class={styles.handle} />
        <div class={styles.title} id="tagging-title">
          How are you feeling?
        </div>

        <TagPicker
          presetTags={settings.presetTags}
          selectedTags={selectedTags}
          onToggleTag={handleToggleTag}
          onAddCustomTag={handleAddCustomTag}
        />

        <textarea
          class={styles.textarea}
          placeholder="What happened? (optional)"
          aria-label="What happened? Optional note"
          value={note}
          onInput={(e) => {
            setNote((e.target as HTMLTextAreaElement).value)
            handleActivity()
          }}
        />

        <div class={styles.actions}>
          <button class={styles.doneBtn} onClick={commitAndClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
