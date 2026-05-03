import type { JSX } from 'solid-js'

export type BankId = 'chase' | 'amex' | 'boa' | 'csv'

const PALETTE: Record<BankId, { letters: string; bg: string }> = {
  chase: { letters: 'CH', bg: '#1f4d8c' },
  amex: { letters: 'AX', bg: '#2a6c9a' },
  boa: { letters: 'BA', bg: '#7a4f5a' },
  csv: { letters: 'CSV', bg: '#5b6270' },
}

/** Coarse heuristic from filename → bank id, for recent-imports list. */
export function inferBankId(filename: string): BankId {
  const lower = filename.toLowerCase()
  if (lower.includes('chase')) return 'chase'
  if (lower.includes('amex')) return 'amex'
  if (lower.includes('bofa') || lower.includes('boa')) return 'boa'
  return 'csv'
}

export default function BankGlyph(props: { id: BankId; size?: number }): JSX.Element {
  const size = () => props.size ?? 28
  const meta = () => PALETTE[props.id]
  return (
    <div
      class="inline-flex items-center justify-center rounded-md text-white font-bold tracking-wide shrink-0"
      style={{
        width: `${size()}px`,
        height: `${size()}px`,
        background: meta().bg,
        'font-size': `${size() <= 22 ? 9 : 10}px`,
      }}
    >
      {meta().letters}
    </div>
  )
}
