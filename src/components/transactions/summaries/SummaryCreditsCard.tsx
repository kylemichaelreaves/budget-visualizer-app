import type { JSX } from 'solid-js'
import SummaryStatCard from './SummaryStatCard'
import { formatUsdAbs } from '@utils/formatUsd'

export default function SummaryCreditsCard(props: { total: number; count: number }): JSX.Element {
  return (
    <SummaryStatCard
      title="Total Credits"
      dataTestId="summary-credits-card"
      icon={
        <svg
          class="size-4 text-green-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="16 12 12 8 8 12" />
          <line x1="12" y1="16" x2="12" y2="8" />
        </svg>
      }
      value={<div class="text-2xl font-bold text-green-500">+{formatUsdAbs(props.total)}</div>}
      subtitle={`${props.count} income transaction${props.count !== 1 ? 's' : ''}`}
    />
  )
}
