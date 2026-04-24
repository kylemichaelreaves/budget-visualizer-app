import type { JSX } from 'solid-js'
import SummaryStatCard from './SummaryStatCard'

export default function SummaryDebitsCard(props: { total: number; count: number }): JSX.Element {
  return <SummaryStatCard variant="debit" total={props.total} count={props.count} />
}
