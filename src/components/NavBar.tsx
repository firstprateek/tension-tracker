import styles from './NavBar.module.css'

export type Route = 'buzzer' | 'stats' | 'journal' | 'settings'

interface NavBarProps {
  active: Route
  onNavigate: (route: Route) => void
}

const TABS: { route: Route; icon: string; label: string }[] = [
  { route: 'buzzer', icon: '⚠', label: 'Buzzer' },
  { route: 'stats', icon: '▂▅▇', label: 'Stats' },
  { route: 'journal', icon: '✎', label: 'Journal' },
  { route: 'settings', icon: '⚙', label: 'Settings' },
]

export function NavBar({ active, onNavigate }: NavBarProps) {
  return (
    <nav class={styles.nav}>
      {TABS.map(({ route, icon, label }) => (
        <button
          key={route}
          class={`${styles.tab} ${active === route ? styles.active : ''}`}
          aria-current={active === route ? 'page' : undefined}
          onClick={() => onNavigate(route)}
        >
          <span class={styles.tabIcon} aria-hidden="true">
            {icon}
          </span>
          {label}
        </button>
      ))}
    </nav>
  )
}
