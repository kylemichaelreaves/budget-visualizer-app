import { type JSX, createEffect, createMemo, createSignal, onCleanup, Show, untrack } from 'solid-js'
import { useElementSize } from '@composables/useElementSize'
import {
  BERLIN_CATEGORY_BY_KEY,
  byId,
  walkMinutesFromHotel,
  type BerlinCategoryKey,
} from '../data/berlinPlaces'
import { DAYS } from '../data/berlinItinerary'
import { CatGlyph } from '../ui/BerlinPrimitives'
import { createBerlinMap, type BerlinMapHandle, type BerlinMapLayers } from './createBerlinMap'

type Tip = { x: number; y: number; label: string } | null
type Pop = { id: string; x: number; y: number } | null

export type BerlinTripMapProps = {
  layers: () => BerlinMapLayers
  visibleCategories: () => ReadonlySet<BerlinCategoryKey>
  filterFaded: () => ReadonlySet<string>
  dayIds: () => readonly string[]
  cluster: () => boolean
  selectedId: () => string | null
  onSelect: (id: string | null) => void
  registerHandle: (h: BerlinMapHandle) => void
}

function placeDays(id: string): string[] {
  return DAYS.filter((d) => d.stops.some((s) => s.placeId === id)).map((d) => `${d.short} ${d.date}`)
}

export default function BerlinTripMap(props: BerlinTripMapProps): JSX.Element {
  let svgEl: SVGSVGElement | undefined
  const [dims, attachWrapper] = useElementSize()
  const [tip, setTip] = createSignal<Tip>(null)
  const [pop, setPop] = createSignal<Pop>(null)
  let handle: BerlinMapHandle | null = null

  createEffect(() => {
    const el = svgEl
    const w = dims().w
    const h = dims().h
    if (!el || w <= 0 || h <= 0) return

    handle?.destroy()
    handle = createBerlinMap(el, w, h, {
      onLineEnter: (label, e) => {
        setPop(null)
        setTip({ x: e.offsetX, y: e.offsetY, label })
      },
      onLineMove: (label, e) => setTip({ x: e.offsetX, y: e.offsetY, label }),
      onLineLeave: () => setTip(null),
      onPinEnter: (place, e) => setTip({ x: e.offsetX, y: e.offsetY, label: place.name }),
      onPinLeave: () => setTip(null),
      onPinClick: (place, x, y) => {
        setTip(null)
        setPop({ id: place.id, x, y })
        props.onSelect(place.id)
      },
    })

    untrack(() => {
      handle?.setVisibleCategories(props.visibleCategories())
      handle?.setLayers(props.layers())
      handle?.setFilterFaded(props.filterFaded())
      handle?.setDay(props.dayIds())
      handle?.setCluster(props.cluster())
      handle?.setSelected(props.selectedId())
      props.registerHandle(handle!)
    })
  })

  createEffect(() => handle?.setVisibleCategories(props.visibleCategories()))
  createEffect(() => handle?.setLayers(props.layers()))
  createEffect(() => handle?.setFilterFaded(props.filterFaded()))
  createEffect(() => handle?.setDay(props.dayIds()))
  createEffect(() => handle?.setCluster(props.cluster()))
  createEffect(() => handle?.setSelected(props.selectedId()))

  onCleanup(() => {
    handle?.destroy()
    handle = null
  })

  const popPlace = createMemo(() => {
    const p = pop()
    return p ? byId[p.id] : null
  })

  return (
    <div ref={(el) => attachWrapper(el)} class="relative h-full w-full" data-testid="berlin-trip-map">
      <svg
        ref={(el) => {
          svgEl = el
        }}
        class="block h-full w-full"
        style={{ background: 'var(--wf-paper)' }}
        data-testid="berlin-trip-map-svg"
      />

      <Show when={tip()}>
        {(t) => (
          <div
            class="pointer-events-none absolute z-10 max-w-[15rem] rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-md"
            style={{
              left: `${t().x + 14}px`,
              top: `${t().y + 14}px`,
              background: 'var(--wf-glass)',
              border: '1.5px solid var(--wf-line)',
              color: 'var(--wf-ink)',
            }}
          >
            {t().label}
          </div>
        )}
      </Show>

      <Show when={popPlace()} keyed>
        {(place) => {
          const cat = BERLIN_CATEGORY_BY_KEY[place.category]
          const walk = walkMinutesFromHotel(place)
          const days = placeDays(place.id)
          const p = pop()!
          return (
            <div
              class="absolute z-20 w-60 overflow-hidden rounded-lg shadow-xl"
              style={{
                left: `${Math.min(p.x + 16, dims().w - 250)}px`,
                top: `${Math.max(8, p.y - 150)}px`,
                background: 'var(--wf-paper-2)',
                border: '1.5px solid var(--wf-ink)',
              }}
            >
              <div
                class="flex items-start gap-2 px-3 pb-2.5 pt-3"
                style={{ 'border-bottom': '1px solid var(--wf-line)' }}
              >
                <CatGlyph cat={place.category} size={17} />
                <div class="flex-1">
                  <div class="text-sm font-bold leading-tight">{place.name}</div>
                  <div class="mt-0.5 text-[10.5px]" style={{ color: 'var(--wf-muted)' }}>
                    {cat.label}
                  </div>
                </div>
                <button
                  type="button"
                  class="text-base leading-none"
                  style={{ color: 'var(--wf-muted)' }}
                  onClick={() => {
                    setPop(null)
                    props.onSelect(null)
                  }}
                >
                  ×
                </button>
              </div>
              <div class="flex flex-col gap-1.5 px-3 py-2.5 text-[11.5px]">
                <div class="flex gap-2">
                  <span class="w-[68px] shrink-0" style={{ color: 'var(--wf-muted)' }}>
                    From hotel
                  </span>
                  <span class="font-semibold">
                    {walk == null ? 'transit needed' : walk === 0 ? 'you are here' : `${walk} min walk`}
                  </span>
                </div>
                <Show when={days.length}>
                  <div class="flex gap-2">
                    <span class="w-[68px] shrink-0" style={{ color: 'var(--wf-muted)' }}>
                      On
                    </span>
                    <span class="font-semibold">{days.join(', ')}</span>
                  </div>
                </Show>
              </div>
              <div class="flex gap-2 px-3 pb-3">
                <button
                  type="button"
                  class="flex-1 rounded-full py-1.5 text-[11px] font-bold"
                  style={{ background: 'var(--wf-ink)', color: 'var(--wf-paper)' }}
                  onClick={() => handle?.focusPlace(place.id)}
                >
                  Focus on map
                </button>
              </div>
            </div>
          )
        }}
      </Show>
    </div>
  )
}
