import { type JSX, Show } from 'solid-js'
import { BERLIN_CATEGORY_BY_KEY, type BerlinCategoryKey } from '../data/berlinPlaces'
import { shapeNode } from '../data/berlinShapes'

/** A category silhouette (no pin stem) — used in legends, chips, lists. */
export function CatGlyph(props: { cat: BerlinCategoryKey; size?: number; colorOn?: boolean }): JSX.Element {
  const size = () => props.size ?? 16
  const cat = () => BERLIN_CATEGORY_BY_KEY[props.cat]
  const node = () => shapeNode(cat().shape, size(), 1.4)
  const fill = () => (props.colorOn === false ? 'var(--wf-paper-2)' : cat().color)
  return (
    <svg
      width={size()}
      height={size()}
      viewBox={`0 0 ${size()} ${size()}`}
      style={{ display: 'block', 'flex-shrink': 0 }}
    >
      {(() => {
        const n = node()
        const common = {
          fill: fill(),
          stroke: 'var(--wf-ink)',
          'stroke-width': 1.4,
          'stroke-linejoin': 'round' as const,
        }
        return n.tag === 'circle' ? (
          <circle {...n.attrs} {...common} />
        ) : n.tag === 'rect' ? (
          <rect {...n.attrs} {...common} />
        ) : (
          <polygon points={n.attrs.points} {...common} />
        )
      })()}
    </svg>
  )
}

export function Toggle(props: { on?: boolean; accentOn?: boolean; onClick?: () => void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => props.onClick?.()}
      aria-pressed={props.on}
      style={{
        width: '30px',
        height: '17px',
        'border-radius': '999px',
        border: '1.5px solid var(--wf-ink)',
        background: props.on ? (props.accentOn ? 'var(--wf-accent)' : 'var(--wf-ink)') : 'var(--wf-paper-2)',
        position: 'relative',
        'flex-shrink': 0,
        padding: 0,
        cursor: props.onClick ? 'pointer' : 'default',
        transition: 'background .15s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '1.5px',
          left: props.on ? '14px' : '1.5px',
          width: '11px',
          height: '11px',
          'border-radius': '50%',
          background: props.on ? '#fff' : 'var(--wf-ink)',
          transition: 'left .15s',
        }}
      />
    </button>
  )
}

export function Badge(props: { children: JSX.Element }): JSX.Element {
  return (
    <span
      style={{
        'font-size': '10px',
        'font-weight': 700,
        border: '1.2px solid var(--wf-muted)',
        color: 'var(--wf-muted)',
        'border-radius': '999px',
        padding: '0 6px',
        'min-width': '16px',
        'text-align': 'center',
        'line-height': '15px',
        display: 'inline-block',
      }}
    >
      {props.children}
    </span>
  )
}

export function Chip(props: {
  cat?: BerlinCategoryKey
  on?: boolean
  onClick?: () => void
  children: JSX.Element
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => props.onClick?.()}
      style={{
        display: 'inline-flex',
        'align-items': 'center',
        gap: '5px',
        border: props.on ? '1.5px solid var(--wf-ink)' : '1.5px dashed var(--wf-muted)',
        'border-radius': '999px',
        padding: '3px 9px 3px 6px',
        background: props.on ? 'var(--wf-paper-2)' : 'transparent',
        'font-size': '11px',
        'font-weight': 600,
        color: props.on ? 'var(--wf-ink)' : 'var(--wf-muted)',
        'white-space': 'nowrap',
        cursor: 'pointer',
        'font-family': "'Kalam', system-ui, sans-serif",
      }}
    >
      <Show when={props.cat}>{(c) => <CatGlyph cat={c()} size={12} />}</Show>
      {props.children}
    </button>
  )
}

/** A hand-written annotation callout (Caveat). */
export function Note(props: {
  children: JSX.Element
  width?: string
  style?: JSX.CSSProperties
}): JSX.Element {
  return (
    <div
      class="wf-hand"
      style={{
        width: props.width ?? '100%',
        background: 'var(--wf-glass)',
        border: '1.5px dashed var(--wf-muted)',
        'border-radius': '7px',
        padding: '7px 10px',
        'font-size': '16px',
        'line-height': '1.18',
        color: 'var(--wf-ink)',
        'box-shadow': '0 2px 8px rgba(0,0,0,0.07)',
        ...props.style,
      }}
    >
      {props.children}
    </div>
  )
}
