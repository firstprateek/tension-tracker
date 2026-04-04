import type { ComponentChildren } from 'preact'
import styles from './StatCard.module.css'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  children?: ComponentChildren
}

export function StatCard({ label, value, sub, children }: StatCardProps) {
  return (
    <div class={styles.card}>
      <div class={styles.label}>{label}</div>
      <div class={styles.value}>{value}</div>
      {sub && <div class={styles.sub}>{sub}</div>}
      {children}
    </div>
  )
}
