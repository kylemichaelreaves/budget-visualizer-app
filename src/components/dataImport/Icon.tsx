import type { JSX } from 'solid-js'

// Shared stroke-icon set for the CSV-import flow. Paths are 24×24, drawn with
// currentColor so callers control hue via text-* utilities.
const PATHS = {
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6',
  check: 'M20 6L9 17l-5-5',
  alert: 'M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01',
  x: 'M18 6L6 18M6 6l12 12',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
} satisfies Record<string, string>

export type IconName = keyof typeof PATHS

export default function Icon(props: {
  name: IconName
  size?: number
  stroke?: number
  class?: string
}): JSX.Element {
  return (
    <svg
      width={props.size ?? 16}
      height={props.size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={props.stroke ?? 1.8}
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
      aria-hidden="true"
    >
      <path d={PATHS[props.name]} />
    </svg>
  )
}
