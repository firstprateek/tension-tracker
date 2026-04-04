import { useState, useCallback } from 'preact/hooks'
import { vibrate } from '../lib/haptics.ts'
import styles from './Buzzer.module.css'

interface BuzzerProps {
  color: string
  label: string
  count: number
  small?: boolean
  onPress: () => void
}

export function Buzzer({ color, label, count, small, onPress }: BuzzerProps) {
  const [pressed, setPressed] = useState(false)
  const [showRipple, setShowRipple] = useState(false)

  const handlePress = useCallback(() => {
    vibrate(50)
    setPressed(true)
    setShowRipple(true)
    onPress()
    setTimeout(() => setPressed(false), 400)
    setTimeout(() => setShowRipple(false), 600)
  }, [onPress])

  const glowColor = `${color}4d` // 30% opacity

  return (
    <div class={styles.buzzerWrapper}>
      <button
        class={`${styles.buzzer} ${pressed ? styles.pressed : ''} ${small ? styles.buzzerSmall : ''}`}
        style={{ backgroundColor: color, '--glow-color': glowColor } as Record<string, string>}
        onClick={handlePress}
        aria-label={`Log tension for ${label}`}
      >
        {showRipple && <span class={styles.ripple} />}
        !
      </button>
      <div class={styles.counter}>
        <span class={styles.counterNumber}>{count}</span> this week
      </div>
    </div>
  )
}
