import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'

const sizeConfig = {
  small: { title: 'text-xs mb-1', value: 'text-lg' },
  default: { title: 'text-sm mb-1.5', value: 'text-2xl' },
  large: { title: 'text-base mb-2', value: 'text-3xl' },
} as const

export default function StatisticComponent(props: {
  title: string
  value: number | string
  previousValue?: number | string
  size?: 'small' | 'default' | 'large'
  dataTestId?: string
  precision?: number
}): JSX.Element {
  const sizes = () => sizeConfig[props.size ?? 'default']

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
    <div data-testid={props.dataTestId || undefined}>
      <div class={`font-medium text-muted-foreground ${sizes().title}`}>{props.title}</div>
      <div class={`font-semibold text-foreground ${sizes().value}`}>{displayValue()}</div>
      {props.previousValue !== undefined && difference() !== null ? (
        <div class="mt-2 text-xs text-muted-foreground">
          {difference()! > 0 ? (
            <span class="text-positive">Increase</span>
          ) : difference()! < 0 ? (
            <span class="text-negative">Decrease</span>
          ) : (
            <span>No Change</span>
          )}
          <span> from last period: {Math.abs(difference()!)}</span>
        </div>
      ) : null}
    </div>
  )
}
