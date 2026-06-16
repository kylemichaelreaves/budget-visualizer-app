import { type JSX, createEffect, createMemo, createSignal, onCleanup, Show, untrack } from 'solid-js'
import { useElementSize } from '@composables/useElementSize'
import { byId, type BerlinCategoryKey } from '../data/berlinPlaces'
import { PinPopover } from './PinPopover'
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
        {(place) => (
          <PinPopover
            place={place}
            x={pop()!.x}
            y={pop()!.y}
            containerWidth={dims().w}
            onClose={() => {
              setPop(null)
              props.onSelect(null)
            }}
            onFocus={() => handle?.focusPlace(place.id)}
          />
        )}
      </Show>
    </div>
  )
}
