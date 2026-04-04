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

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(onClose, AUTO_DISMISS_MS)
  }, [onClose])

  useEffect(() => {
    resetTimer()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [resetTimer])

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

  const handleDone = useCallback(async () => {
    await updateEvent(eventId, { tags: selectedTags, note: note.trim() })
    onClose()
  }, [eventId, selectedTags, note, onClose])

  return (
    <div class={styles.overlay} onClick={onClose}>
      <div class={styles.sheet} onClick={(e) => e.stopPropagation()} onTouchStart={handleActivity}>
        <div class={styles.handle} />
        <div class={styles.title}>How are you feeling?</div>

        <TagPicker
          presetTags={settings.presetTags}
          selectedTags={selectedTags}
          onToggleTag={handleToggleTag}
          onAddCustomTag={handleAddCustomTag}
        />

        <textarea
          class={styles.textarea}
          placeholder="What happened? (optional)"
          value={note}
          onInput={(e) => {
            setNote((e.target as HTMLTextAreaElement).value)
            handleActivity()
          }}
        />

        <div class={styles.actions}>
          <button class={styles.doneBtn} onClick={handleDone}>
            Done
          </button>
          <button class={styles.skipBtn} onClick={onClose}>
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
