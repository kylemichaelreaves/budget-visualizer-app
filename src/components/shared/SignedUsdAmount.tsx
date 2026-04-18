import type { JSX } from 'solid-js'
import { formatUsdAbs } from '@utils/formatUsd'

export function signedUsdToneClass(variant: 'debit' | 'credit'): string {
  return variant === 'credit'
    ? 'font-semibold tabular-nums text-positive'
    : 'font-semibold tabular-nums text-negative'
}

/** Absolute amount with explicit +/- and shared debit/credit tone classes. */
export default function SignedUsdAmount(props: {
  variant: 'debit' | 'credit'
  value: number
  class?: string
}): JSX.Element {
  const sign = () => (props.variant === 'credit' ? '+' : '-')
  return (
    <span class={`${signedUsdToneClass(props.variant)} ${props.class ?? ''}`}>
      {sign()}
      {formatUsdAbs(props.value)}
    </span>
  )
}
