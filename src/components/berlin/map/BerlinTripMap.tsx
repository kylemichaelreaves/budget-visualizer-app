import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, onCleanup, Show, untrack } from 'solid-js'
import { useElementSize } from '@composables/useElementSize'
import { BERLIN_CATEGORY_BY_KEY, type BerlinCategoryKey, type BerlinPlace } from '../data/berlinPlaces'
import { createBerlinMap, type BerlinMapHandle, type BerlinMapLayers } from './createBerlinMap'

const ASPECT = 0.7 // height / width

type Tooltip = { x: number; y: number; place: BerlinPlace } | null

export type BerlinTripMapProps = {
  places: readonly BerlinPlace[]
  selectedId: () => string | null
  visibleCategories: () => ReadonlySet<BerlinCategoryKey>
  layers: () => BerlinMapLayers
  onSelect: (id: string | null) => void
  /** Exposes the imperative handle so the page can focus / reset the view. */
  onReady?: (handle: BerlinMapHandle) => void
}

export default function BerlinTripMap(props: BerlinTripMapProps): JSX.Element {
  let svgEl: SVGSVGElement | undefined
  const [dims, attachWrapper] = useElementSize()
  const width = createMemo(() => dims().w)
  const [tooltip, setTooltip] = createSignal<Tooltip>(null)

  let handle: BerlinMapHandle | null = null

  createEffect(() => {
    const el = svgEl
    const w = width()
    if (!el || w <= 0) return
    const h = Math.max(360, Math.round(w * ASPECT))

    handle?.destroy()
    handle = createBerlinMap(el, props.places, w, h, {
      onEnter: (place, event) => setTooltip({ x: event.offsetX, y: event.offsetY, place }),
      onMove: (place, event) => setTooltip({ x: event.offsetX, y: event.offsetY, place }),
      onLeave: () => setTooltip(null),
      onClick: (place) => props.onSelect(place.id),
    })

    untrack(() => {
      handle?.setSelected(props.selectedId())
      handle?.setVisibleCategories(props.visibleCategories())
      handle?.setLayers(props.layers())
      props.onReady?.(handle!)
    })
  })

  createEffect(() => {
    const id = props.selectedId()
    handle?.setSelected(id)
  })

  createEffect(() => {
    const keys = props.visibleCategories()
    handle?.setVisibleCategories(keys)
  })

  createEffect(() => {
    const layers = props.layers()
    handle?.setLayers(layers)
  })

  onCleanup(() => {
    handle?.destroy()
    handle = null
  })

  return (
    <div ref={(el) => attachWrapper(el)} class="relative w-full" data-testid="berlin-trip-map">
      <svg
        ref={(el) => {
          svgEl = el
        }}
        class="block w-full bg-card rounded-md border border-border text-foreground"
        data-testid="berlin-trip-map-svg"
      />
      <Show when={tooltip()}>
        {(tt) => (
          <div
            class="pointer-events-none absolute z-10 max-w-56 rounded-md border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"
            style={{
              left: `${tt().x + 14}px`,
              top: `${tt().y + 14}px`,
            }}
          >
            <div class="flex items-center gap-2">
              <span
                class="inline-block size-2.5 shrink-0 rounded-full"
                style={{ 'background-color': BERLIN_CATEGORY_BY_KEY[tt().place.category].color }}
              />
              <span class="font-medium leading-tight">{tt().place.name}</span>
            </div>
            <div class="mt-1 text-xs text-muted-foreground">
              {BERLIN_CATEGORY_BY_KEY[tt().place.category].label}
            </div>
          </div>
        )}
      </Show>
    </div>
  )
}
