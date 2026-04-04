import type { DayCount } from '../hooks/useWeekStats.ts'

interface WeekChartProps {
  dailyCounts: DayCount[]
  color?: string
}

export function WeekChart({ dailyCounts, color = 'var(--color-accent)' }: WeekChartProps) {
  const maxCount = Math.max(1, ...dailyCounts.map((d) => d.count))
  const barHeight = 28
  const gap = 6
  const labelWidth = 36
  const countWidth = 30
  const svgHeight = dailyCounts.length * (barHeight + gap) - gap

  return (
    <svg width="100%" height={svgHeight} viewBox={`0 0 300 ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
      {dailyCounts.map((d, i) => {
        const y = i * (barHeight + gap)
        const barWidth = (d.count / maxCount) * (300 - labelWidth - countWidth - 16)
        return (
          <g key={d.day}>
            <text x={0} y={y + barHeight / 2 + 5} fill="var(--color-text-muted)" font-size="12" font-family="var(--font-sans)">
              {d.day}
            </text>
            <rect
              x={labelWidth}
              y={y + 2}
              width={Math.max(barWidth, d.count > 0 ? 4 : 0)}
              height={barHeight - 4}
              rx={4}
              fill={color}
              opacity={0.8}
            />
            {d.count > 0 && (
              <text
                x={labelWidth + barWidth + 8}
                y={y + barHeight / 2 + 5}
                fill="var(--color-text)"
                font-size="12"
                font-family="var(--font-sans)"
                font-weight="600"
              >
                {d.count}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
