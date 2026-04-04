import styles from './NavBar.module.css'

export type Route = 'buzzer' | 'stats' | 'journal' | 'settings'

interface NavBarProps {
  active: Route
  onNavigate: (route: Route) => void
}

export function NavBar({ active, onNavigate }: NavBarProps) {
  return (
    <nav class={styles.nav}>
      <button
        class={`${styles.tab} ${active === 'buzzer' ? styles.active : ''}`}
        onClick={() => onNavigate('buzzer')}
      >
        <span class={styles.tabIcon}>&#9888;</span>
        Buzzer
      </button>
      <button
        class={`${styles.tab} ${active === 'stats' ? styles.active : ''}`}
        onClick={() => onNavigate('stats')}
      >
        <span class={styles.tabIcon}>&#9776;</span>
        Stats
      </button>
      <button
        class={`${styles.tab} ${active === 'journal' ? styles.active : ''}`}
        onClick={() => onNavigate('journal')}
      >
        <span class={styles.tabIcon}>&#9998;</span>
        Journal
      </button>
      <button
        class={`${styles.tab} ${active === 'settings' ? styles.active : ''}`}
        onClick={() => onNavigate('settings')}
      >
        <span class={styles.tabIcon}>&#9881;</span>
        Settings
      </button>
    </nav>
  )
}
