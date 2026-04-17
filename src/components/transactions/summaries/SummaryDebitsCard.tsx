import type { JSX } from 'solid-js'
import SummaryStatCard from './SummaryStatCard'
import { formatUsdAbs } from '@utils/formatUsd'

export default function SummaryDebitsCard(props: { total: number; count: number }): JSX.Element {
  return (
    <SummaryStatCard
      title="Total Debits"
      dataTestId="summary-debits-card"
      icon={
        <svg
          class="size-4 text-red-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="8 12 12 16 16 12" />
          <line x1="12" y1="8" x2="12" y2="16" />
        </svg>
      }
      value={<div class="text-2xl font-bold text-red-500">-{formatUsdAbs(props.total)}</div>}
      subtitle={`${props.count} expense transaction${props.count !== 1 ? 's' : ''}`}
    />
  )
}
