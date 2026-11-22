import SummaryStatCard from './SummaryStatCard'
import type { JSX } from '@solidjs/web'

export default function SummaryCreditsCard(props: { total: number; count: number }): JSX.Element {
  return <SummaryStatCard variant="credit" total={props.total} count={props.count} />
}
