import type { JSX } from 'solid-js'
import SummaryStatCard from './SummaryStatCard'

export default function SummaryCreditsCard(props: { total: number; count: number }): JSX.Element {
  return <SummaryStatCard variant="credit" total={props.total} count={props.count} />
}
