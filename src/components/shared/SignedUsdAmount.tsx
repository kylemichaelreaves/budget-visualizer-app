import type { JSX } from 'solid-js'
import { formatUsdAbs } from '@utils/formatUsd'

export function signedUsdToneClass(variant: 'debit' | 'credit'): string {
  return variant === 'credit'
    ? 'font-semibold tabular-nums text-green-600 dark:text-green-400'
    : 'font-semibold tabular-nums text-red-600 dark:text-red-400'
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
