import { createMemo, createSignal, For, Show, type JSX } from 'solid-js'
import { Button } from '@components/ui/button'
import { BERLIN_CATEGORIES, BERLIN_PLACES, type BerlinCategoryKey } from './data/berlinPlaces'
import { BERLIN_TRANSIT_LINES } from './data/berlinTransitLines'
import BerlinTripMap from './map/BerlinTripMap'
import type { BerlinMapHandle, BerlinMapLayers } from './map/createBerlinMap'

const ALL_CATEGORY_KEYS = BERLIN_CATEGORIES.map((c) => c.key)

const LAYER_TOGGLES: { key: keyof BerlinMapLayers; label: string }[] = [
  { key: 'streets', label: 'Streets' },
  { key: 'water', label: 'Water' },
  { key: 'metro', label: 'Metro (U/S-Bahn)' },
]

export default function BerlinTripPage(): JSX.Element {
  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [visible, setVisible] = createSignal<ReadonlySet<BerlinCategoryKey>>(new Set(ALL_CATEGORY_KEYS))
  const [layers, setLayers] = createSignal<BerlinMapLayers>({
    streets: true,
    water: true,
    metro: true,
  })
  let handle: BerlinMapHandle | null = null

  function toggleCategory(key: BerlinCategoryKey): void {
    const next = new Set(visible())
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setVisible(next)
  }

  function toggleLayer(key: keyof BerlinMapLayers): void {
    setLayers({ ...layers(), [key]: !layers()[key] })
  }

  function selectPlace(id: string): void {
    setSelectedId(id)
    handle?.focusPlace(id)
  }

  function resetView(): void {
    setSelectedId(null)
    handle?.resetView()
  }

  const placesByCategory = createMemo(() =>
    BERLIN_CATEGORIES.map((cat) => ({
      cat,
      places: BERLIN_PLACES.filter((p) => p.category === cat.key),
    })),
  )

  return (
    <div class="flex flex-col gap-3" data-testid="berlin-trip-page">
      {/* Legend / category toggles */}
      <div class="flex flex-wrap items-center gap-2">
        <For each={BERLIN_CATEGORIES}>
          {(cat) => {
            const active = () => visible().has(cat.key)
            return (
              <button
                type="button"
                onClick={() => toggleCategory(cat.key)}
                aria-pressed={active()}
                class="flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors"
                classList={{
                  'border-border bg-card text-foreground': active(),
                  'border-transparent bg-muted text-muted-foreground line-through': !active(),
                }}
              >
                <span
                  class="inline-block size-3 rounded-full"
                  style={{ 'background-color': active() ? cat.color : 'transparent' }}
                  classList={{ 'ring-1 ring-border': !active() }}
                />
                {cat.label}
              </button>
            )
          }}
        </For>
        <Button type="button" variant="outline" size="sm" class="ml-auto" onClick={resetView}>
          Reset view
        </Button>
      </div>

      {/* Base-layer toggles */}
      <div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <For each={LAYER_TOGGLES}>
          {(toggle) => (
            <label class="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                class="size-4 accent-brand"
                checked={layers()[toggle.key]}
                onChange={() => toggleLayer(toggle.key)}
              />
              {toggle.label}
            </label>
          )}
        </For>
        <Show when={layers().metro}>
          <span class="flex flex-wrap items-center gap-1.5">
            <For each={BERLIN_TRANSIT_LINES}>
              {(line) => (
                <span
                  class="rounded px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white"
                  style={{ 'background-color': line.color }}
                  classList={{ 'outline outline-1 outline-white/40': line.net === 'sbahn' }}
                  title={line.net === 'sbahn' ? 'S-Bahn (dashed)' : 'U-Bahn'}
                >
                  {line.ref}
                </span>
              )}
            </For>
          </span>
        </Show>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <BerlinTripMap
          places={BERLIN_PLACES}
          selectedId={selectedId}
          visibleCategories={visible}
          layers={layers}
          onSelect={setSelectedId}
          onReady={(h) => (handle = h)}
        />

        {/* Grouped place list */}
        <aside class="flex flex-col gap-4 lg:max-h-[70vh] lg:overflow-y-auto" aria-label="Places">
          <For each={placesByCategory()}>
            {(group) => (
              <div>
                <h2 class="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <span
                    class="inline-block size-2.5 rounded-full"
                    style={{ 'background-color': group.cat.color }}
                  />
                  {group.cat.label}
                </h2>
                <ul class="flex flex-col">
                  <For each={group.places}>
                    {(place) => (
                      <li>
                        <button
                          type="button"
                          onClick={() => selectPlace(place.id)}
                          class="w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                          classList={{
                            'bg-accent font-medium': selectedId() === place.id,
                          }}
                        >
                          {place.name}
                        </button>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            )}
          </For>
        </aside>
      </div>
    </div>
  )
}
