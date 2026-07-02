import type { ComponentChildren } from 'preact'
import styles from './StatCard.module.css'

export interface Trend {
  text: string
  good: boolean
}

interface StatCardProps {
  label: string
  value: string
  sub?: string
  trend?: Trend
  children?: ComponentChildren
}

export function StatCard({ label, value, sub, trend, children }: StatCardProps) {
  return (
    <div class={styles.card}>
      <div class={styles.label}>{label}</div>
      <div class={styles.value}>{value}</div>
      {sub && <div class={styles.sub}>{sub}</div>}
      {trend && (
        <div class={`${styles.trend} ${trend.good ? styles.trendGood : styles.trendBad}`}>{trend.text}</div>
      )}
      {children}
    </div>
  )
}
