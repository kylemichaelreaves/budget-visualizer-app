import SummaryStatCard from './SummaryStatCard'
import type { JSX } from '@solidjs/web'

export default function SummaryDebitsCard(props: { total: number; count: number }): JSX.Element {
  return <SummaryStatCard variant="debit" total={props.total} count={props.count} />
}
