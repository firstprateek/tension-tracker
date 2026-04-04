import { useState, useCallback } from 'preact/hooks'
import styles from './TagPicker.module.css'

interface TagPickerProps {
  presetTags: string[]
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  onAddCustomTag: (tag: string) => void
}

export function TagPicker({ presetTags, selectedTags, onToggleTag, onAddCustomTag }: TagPickerProps) {
  const [customTag, setCustomTag] = useState('')

  const handleAdd = useCallback(() => {
    const trimmed = customTag.trim().toLowerCase()
    if (trimmed && !presetTags.includes(trimmed) && !selectedTags.includes(trimmed)) {
      onAddCustomTag(trimmed)
      onToggleTag(trimmed)
    } else if (trimmed) {
      onToggleTag(trimmed)
    }
    setCustomTag('')
  }, [customTag, presetTags, selectedTags, onAddCustomTag, onToggleTag])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAdd()
      }
    },
    [handleAdd],
  )

  const allTags = [...new Set([...presetTags, ...selectedTags])]

  return (
    <div>
      <div class={styles.tagList}>
        {allTags.map((tag) => (
          <button
            key={tag}
            class={`${styles.tag} ${selectedTags.includes(tag) ? styles.selected : ''}`}
            onClick={() => onToggleTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <div class={styles.addTagRow}>
        <input
          class={styles.addTagInput}
          type="text"
          placeholder="+ Add tag..."
          value={customTag}
          onInput={(e) => setCustomTag((e.target as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
        />
        {customTag.trim() && (
          <button class={styles.addTagBtn} onClick={handleAdd}>
            Add
          </button>
        )}
      </div>
    </div>
  )
}
