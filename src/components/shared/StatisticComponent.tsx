import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'
import './shared-ui.css'

export default function StatisticComponent(props: {
  title: string
  value: number | string
  previousValue?: number | string
  size?: 'small' | 'default' | 'large'
  dataTestId?: string
  precision?: number
}): JSX.Element {
  const sizeClass = () => `bv-statistic-${props.size ?? 'default'}`

  const numericValue = createMemo(() => Number(props.value))

  const displayValue = createMemo(() => {
    const n = numericValue()
    if (props.precision != null) return n.toFixed(props.precision)
    return String(n)
  })

  const difference = createMemo(() => {
    if (props.previousValue === undefined) return null
    return numericValue() - Number(props.previousValue)
  })

  return (
    <div class={sizeClass()} data-testid={props.dataTestId || undefined}>
      <div class="bv-statistic-title">{props.title}</div>
      <div class="bv-statistic-value">{displayValue()}</div>
      {props.previousValue !== undefined && difference() !== null ? (
        <div class="bv-statistic-footer">
          {difference()! > 0 ? (
            <span class="bv-statistic-increase">Increase</span>
          ) : difference()! < 0 ? (
            <span class="bv-statistic-decrease">Decrease</span>
          ) : (
            <span>No Change</span>
          )}
          <span> from last period: {Math.abs(difference()!)}</span>
        </div>
      ) : null}
    </div>
  )
}
