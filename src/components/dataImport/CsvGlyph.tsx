import type { JSX } from 'solid-js'

// Ingestion reads one fixed CSV layout and does no bank detection, so every
// file gets the same glyph rather than one guessed from its name.
export default function CsvGlyph(props: { size?: number }): JSX.Element {
  const size = () => props.size ?? 28
  return (
    <div
      class="inline-flex items-center justify-center rounded-md text-white font-bold tracking-wide shrink-0"
      style={{
        width: `${size()}px`,
        height: `${size()}px`,
        background: '#5b6270',
        'font-size': `${size() <= 22 ? 9 : 10}px`,
      }}
    >
      CSV
    </div>
  )
}
