import { type JSX, createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import { A, useNavigate } from '@solidjs/router'
import { authState } from '@stores/authStore'
import './berlin-paper.css'
import {
  BERLIN_CATEGORIES,
  BERLIN_PLACES,
  byId,
  walkMinutesFromHotel,
  type BerlinCategoryKey,
} from './data/berlinPlaces'
import { DAYS, DAY_BY_KEY, dayPlaceIds, TRIP, type ItineraryDay } from './data/berlinItinerary'
import { Badge, CatGlyph, Chip, Note, Toggle } from './ui/BerlinPrimitives'
import BerlinTripMap from './map/BerlinTripMap'
import type { BerlinFitPreset, BerlinMapHandle, BerlinMapLayers } from './map/createBerlinMap'

const CAT_COUNT: Record<BerlinCategoryKey, number> = BERLIN_CATEGORIES.reduce(
  (m, c) => ((m[c.key] = BERLIN_PLACES.filter((p) => p.category === c.key).length), m),
  {} as Record<BerlinCategoryKey, number>,
)
const ALL_CATS = BERLIN_CATEGORIES.map((c) => c.key)
const ALL_LAYERS: BerlinMapLayers = {
  streets: true,
  boroughs: true,
  water: true,
  rail: true,
  wall: true,
  airport: true,
  commute: true,
  daytrip: true,
}
const BASEMAP_LAYERS: { key: keyof BerlinMapLayers; label: string }[] = [
  { key: 'streets', label: 'Streets' },
  { key: 'boroughs', label: 'Borough boundaries' },
  { key: 'water', label: 'Water' },
  { key: 'rail', label: 'Rail network (U/S-Bahn)' },
  { key: 'wall', label: 'Berlin Wall (former route)' },
]
const TRIP_LINES: { key: keyof BerlinMapLayers; label: string; dash: string; accent?: boolean }[] = [
  { key: 'airport', label: 'Airport rail (BER)', dash: '0' },
  { key: 'commute', label: 'Daily commute', dash: '0', accent: true },
  { key: 'daytrip', label: 'Day-trip rail', dash: '6 4' },
]

const sB = '1.5px solid var(--wf-ink)'

export default function BerlinTripPage(): JSX.Element {
  const navigate = useNavigate()
  onMount(() => {
    if (!authState.isUserAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent('/berlin')}`, { replace: true })
    }
  })

  const [theme, setTheme] = createSignal<'light' | 'dark'>('light')
  const [tab, setTab] = createSignal<'layers' | 'itinerary'>('layers')
  const [query, setQuery] = createSignal('')
  const [walkable, setWalkable] = createSignal(false)
  const [catOn, setCatOn] = createSignal<ReadonlySet<BerlinCategoryKey>>(new Set(ALL_CATS))
  const [layers, setLayers] = createSignal<BerlinMapLayers>({ ...ALL_LAYERS })
  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [activeDayKey, setActiveDayKey] = createSignal<string | null>(null)
  const [tour, setTour] = createSignal(false)
  const [fitPreset, setFitPreset] = createSignal<BerlinFitPreset | null>('city')
  const [cluster, setCluster] = createSignal(true)

  let mapHandle: BerlinMapHandle | null = null

  const visibleCategories = createMemo(() => catOn())
  const dayIds = createMemo<readonly string[]>(() => {
    const k = activeDayKey()
    return k && DAY_BY_KEY[k] ? dayPlaceIds(DAY_BY_KEY[k]) : []
  })
  const filterFaded = createMemo<ReadonlySet<string>>(() => {
    const q = query().trim().toLowerCase()
    const walk = walkable()
    const out = new Set<string>()
    if (!q && !walk) return out
    for (const p of BERLIN_PLACES) {
      const noMatch = q && !p.name.toLowerCase().includes(q)
      const needsTransit = walk && walkMinutesFromHotel(p) == null
      if (noMatch || needsTransit) out.add(p.id)
    }
    return out
  })

  function toggleCat(key: BerlinCategoryKey): void {
    const next = new Set(catOn())
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setCatOn(next)
  }
  function toggleLayer(key: keyof BerlinMapLayers): void {
    setLayers({ ...layers(), [key]: !layers()[key] })
  }
  function selectDay(key: string | null): void {
    setActiveDayKey(key)
    if (key) {
      setTab('itinerary')
      setFitPreset(null)
      const ids = dayPlaceIds(DAY_BY_KEY[key])
      if (ids.length) mapHandle?.fitPlaces(ids)
      else mapHandle?.fit('city')
    }
  }
  function stepDay(dir: 1 | -1): void {
    const keys = DAYS.map((d) => d.key)
    const cur = activeDayKey()
    const idx = cur ? keys.indexOf(cur) : -1
    const next = keys[(idx + dir + keys.length) % keys.length]
    selectDay(next)
  }
  function selectPlace(id: string): void {
    setSelectedId(id)
    mapHandle?.focusPlace(id)
  }
  function doFit(preset: BerlinFitPreset): void {
    setActiveDayKey(null)
    setFitPreset(preset)
    mapHandle?.fit(preset)
  }

  // Auto-advance tour
  createEffect(() => {
    if (!tour()) return
    const id = setInterval(() => stepDay(1), 6000)
    onCleanup(() => clearInterval(id))
  })

  const activeDay = createMemo<ItineraryDay | null>(() => {
    const k = activeDayKey()
    return k ? (DAY_BY_KEY[k] ?? null) : null
  })

  return (
    <div
      class="berlin-paper flex flex-col"
      data-theme={theme()}
      style={{ height: '100dvh', overflow: 'hidden' }}
    >
      <TopBar
        tour={tour()}
        theme={theme()}
        onToggleTour={() => setTour((v) => !v)}
        onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      />

      <div class="flex min-h-0 flex-1">
        <Sidebar
          tab={tab()}
          setTab={setTab}
          query={query()}
          setQuery={setQuery}
          walkable={walkable()}
          setWalkable={setWalkable}
          catOn={catOn()}
          toggleCat={toggleCat}
          layers={layers()}
          toggleLayer={toggleLayer}
          activeDay={activeDay()}
          selectedId={selectedId()}
          onSelectPlace={selectPlace}
        />

        <div class="flex min-w-0 flex-1 flex-col">
          <div class="relative min-h-0 flex-1">
            <BerlinTripMap
              layers={layers}
              visibleCategories={visibleCategories}
              filterFaded={filterFaded}
              dayIds={dayIds}
              cluster={cluster}
              selectedId={selectedId}
              onSelect={setSelectedId}
              registerHandle={(h) => (mapHandle = h)}
            />
            <div class="pointer-events-none absolute inset-0">
              <div class="pointer-events-auto absolute bottom-3.5 left-3.5">
                <Legend catOn={catOn()} toggleCat={toggleCat} />
              </div>
              <div class="pointer-events-auto absolute right-3.5 top-3.5">
                <FitControl
                  preset={fitPreset()}
                  cluster={cluster()}
                  onZoom={(f) => mapHandle?.zoomBy(f)}
                  onFit={doFit}
                  onToggleCluster={() => setCluster((v) => !v)}
                />
              </div>
              <div class="pointer-events-none absolute bottom-4 right-4">
                <ScaleBar
                  label={
                    fitPreset() === 'everything' ? '~10 km' : fitPreset() === 'region' ? '~5 km' : '~1 km'
                  }
                />
              </div>
            </div>
          </div>

          <Stepper
            activeKey={activeDayKey()}
            tour={tour()}
            onPick={selectDay}
            onStep={stepDay}
            onToggleTour={() => setTour((v) => !v)}
          />
        </div>
      </div>
    </div>
  )
}

// ── Top bar ───────────────────────────────────────────────
function TopBar(props: {
  tour: boolean
  theme: string
  onToggleTour: () => void
  onToggleTheme: () => void
}): JSX.Element {
  return (
    <div
      class="flex flex-shrink-0 items-center gap-3 px-4"
      style={{ height: '46px', 'border-bottom': sB, background: 'var(--wf-paper-2)' }}
    >
      <A
        href="/budget-visualizer/transactions"
        class="text-xs font-bold no-underline"
        style={{ color: 'var(--wf-muted)' }}
      >
        ‹ App
      </A>
      <div style={{ width: '1px', height: '22px', background: 'var(--wf-line)' }} />
      <div class="text-sm font-bold" style={{ color: 'var(--wf-ink)' }}>
        {TRIP.title}
      </div>
      <span class="text-[11px]" style={{ color: 'var(--wf-muted)' }}>
        {TRIP.dateRange}
      </span>
      <div class="flex-1" />
      <button
        type="button"
        onClick={() => props.onToggleTour()}
        class="flex items-center gap-2 text-[11px] font-semibold"
        style={{ border: sB, 'border-radius': '999px', padding: '4px 10px 4px 8px', color: 'var(--wf-ink)' }}
      >
        <span
          class="flex items-center justify-center"
          style={{
            width: '16px',
            height: '16px',
            'border-radius': '50%',
            border: '1.5px solid var(--wf-ink)',
            'font-size': '9px',
          }}
        >
          {props.tour ? '❚❚' : '▶'}
        </span>
        Tour mode
      </button>
      <button
        type="button"
        onClick={() => props.onToggleTheme()}
        class="flex items-center justify-center text-sm"
        style={{ width: '28px', height: '28px', 'border-radius': '50%', border: sB, color: 'var(--wf-ink)' }}
        title="Toggle light / dark"
      >
        {props.theme === 'dark' ? '☾' : '☀'}
      </button>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────
function Section(props: { label: string; children: JSX.Element }): JSX.Element {
  return (
    <div style={{ 'border-bottom': '1px solid var(--wf-line)', padding: '13px 15px' }}>
      <div class="wf-mono mb-2 text-[10px] font-bold tracking-widest" style={{ color: 'var(--wf-muted)' }}>
        {props.label}
      </div>
      {props.children}
    </div>
  )
}

function Sidebar(props: {
  tab: 'layers' | 'itinerary'
  setTab: (t: 'layers' | 'itinerary') => void
  query: string
  setQuery: (v: string) => void
  walkable: boolean
  setWalkable: (v: boolean) => void
  catOn: ReadonlySet<BerlinCategoryKey>
  toggleCat: (k: BerlinCategoryKey) => void
  layers: BerlinMapLayers
  toggleLayer: (k: keyof BerlinMapLayers) => void
  activeDay: ItineraryDay | null
  selectedId: string | null
  onSelectPlace: (id: string) => void
}): JSX.Element {
  return (
    <div
      class="flex w-80 flex-shrink-0 flex-col overflow-hidden"
      style={{ 'border-right': sB, background: 'var(--wf-paper)' }}
    >
      <div class="flex flex-shrink-0" style={{ 'border-bottom': sB }}>
        <For
          each={
            [
              ['layers', 'Layers & filters'],
              ['itinerary', 'Itinerary'],
            ] as const
          }
        >
          {([k, lbl]) => (
            <button
              type="button"
              onClick={() => props.setTab(k)}
              class="flex-1 py-2.5 text-center text-xs font-bold"
              style={{
                color: props.tab === k ? 'var(--wf-ink)' : 'var(--wf-muted)',
                'border-bottom': props.tab === k ? '2.5px solid var(--wf-accent)' : '2.5px solid transparent',
                background: props.tab === k ? 'var(--wf-paper-2)' : 'transparent',
              }}
            >
              {lbl}
            </button>
          )}
        </For>
      </div>

      <div class="flex-1 overflow-y-auto">
        <Show
          when={props.tab === 'layers'}
          fallback={
            <ItineraryPanel
              day={props.activeDay}
              selectedId={props.selectedId}
              onSelectPlace={props.onSelectPlace}
            />
          }
        >
          {/* Filters */}
          <Section label="FILTER">
            <div
              class="mb-3 flex items-center gap-2 px-2.5 py-2"
              style={{ border: sB, 'border-radius': '7px' }}
            >
              <span class="text-[13px]">⌕</span>
              <input
                value={props.query}
                onInput={(e) => props.setQuery(e.currentTarget.value)}
                placeholder="Search places…"
                class="w-full bg-transparent text-xs outline-none"
                style={{ color: 'var(--wf-ink)', 'font-family': "'Kalam', sans-serif" }}
              />
            </div>
            <div class="mb-3 flex flex-wrap gap-1.5">
              <For each={BERLIN_CATEGORIES}>
                {(c) => (
                  <Chip cat={c.key} on={props.catOn.has(c.key)} onClick={() => props.toggleCat(c.key)}>
                    {c.short}
                  </Chip>
                )}
              </For>
            </div>
            <div
              class="flex items-center gap-2.5 px-2.5 py-2"
              style={{
                border: props.walkable ? sB : '1.5px dashed var(--wf-muted)',
                'border-radius': '7px',
                background: props.walkable ? 'var(--wf-paper-2)' : 'transparent',
              }}
            >
              <Toggle on={props.walkable} onClick={() => props.setWalkable(!props.walkable)} />
              <div>
                <div class="text-xs font-bold">Walkable from hotel</div>
                <div class="text-[10px]" style={{ color: 'var(--wf-muted)' }}>
                  Dims anything needing transit
                </div>
              </div>
            </div>
          </Section>

          {/* Layers */}
          <Section label="LAYERS">
            <LayerGroup title="Basemap">
              <For each={BASEMAP_LAYERS}>
                {(l) => (
                  <LayerRow
                    label={l.label}
                    on={props.layers[l.key]}
                    onToggle={() => props.toggleLayer(l.key)}
                  />
                )}
              </For>
            </LayerGroup>
            <LayerGroup title="Trip lines">
              <For each={TRIP_LINES}>
                {(l) => (
                  <LayerRow
                    label={l.label}
                    on={props.layers[l.key]}
                    accent={l.accent}
                    swatch={<LineSwatch dash={l.dash} accent={l.accent} />}
                    onToggle={() => props.toggleLayer(l.key)}
                  />
                )}
              </For>
            </LayerGroup>
            <LayerGroup title="Place categories">
              <For each={BERLIN_CATEGORIES}>
                {(c) => (
                  <LayerRow
                    label={c.label}
                    on={props.catOn.has(c.key)}
                    glyph={<CatGlyph cat={c.key} size={14} />}
                    badge={CAT_COUNT[c.key]}
                    onToggle={() => props.toggleCat(c.key)}
                  />
                )}
              </For>
            </LayerGroup>
          </Section>
        </Show>
      </div>
    </div>
  )
}

function LayerGroup(props: { title: string; children: JSX.Element }): JSX.Element {
  return (
    <div class="mb-3">
      <div class="mb-1 text-[11px] font-bold">{props.title}</div>
      {props.children}
    </div>
  )
}

function LayerRow(props: {
  label: string
  on: boolean
  glyph?: JSX.Element
  swatch?: JSX.Element
  badge?: number
  accent?: boolean
  onToggle: () => void
}): JSX.Element {
  return (
    <div class="flex items-center gap-2.5 py-1">
      <Show when={props.glyph}>{props.glyph}</Show>
      <span class="flex-1 text-xs">{props.label}</span>
      <Show when={props.swatch}>{props.swatch}</Show>
      <Show when={props.badge != null}>
        <Badge>{props.badge}</Badge>
      </Show>
      <Toggle on={props.on} accentOn={props.accent} onClick={props.onToggle} />
    </div>
  )
}

function LineSwatch(props: { dash: string; accent?: boolean }): JSX.Element {
  return (
    <svg width="22" height="10" viewBox="0 0 22 10">
      <line
        x1="1"
        y1="5"
        x2="21"
        y2="5"
        stroke={props.accent ? 'var(--wf-accent)' : 'var(--wf-ink)'}
        stroke-width="2.2"
        stroke-dasharray={props.dash}
        stroke-linecap="round"
      />
    </svg>
  )
}

// ── Itinerary list ────────────────────────────────────────
function ItineraryPanel(props: {
  day: ItineraryDay | null
  selectedId: string | null
  onSelectPlace: (id: string) => void
}): JSX.Element {
  return (
    <Show
      when={props.day}
      fallback={
        <div class="p-4">
          <Note>
            Pick a day in the stepper below (or hit ▶ Tour) to walk the trip — the map reframes to each day's
            stops.
          </Note>
        </div>
      }
    >
      {(d) => (
        <Section label={`DAY · ${d().short.toUpperCase()} ${d().date}`}>
          <div class="mb-2.5 text-[13px] font-bold">{d().title}</div>
          <div class="relative">
            <div
              class="absolute"
              style={{
                left: '10px',
                top: '6px',
                bottom: '6px',
                width: '1.5px',
                background: 'var(--wf-line)',
              }}
            />
            <For each={d().stops}>
              {(s, i) => {
                const place = () => (s.placeId ? byId[s.placeId] : null)
                const selected = () => s.placeId != null && s.placeId === props.selectedId
                return (
                  <button
                    type="button"
                    disabled={!s.placeId}
                    onClick={() => s.placeId && props.onSelectPlace(s.placeId)}
                    class="relative flex w-full gap-2.5 rounded-md py-1.5 pr-1 text-left"
                    style={{
                      background: selected() ? 'var(--wf-paper-2)' : 'transparent',
                      cursor: s.placeId ? 'pointer' : 'default',
                    }}
                  >
                    <div class="z-[1] flex w-[21px] flex-shrink-0 justify-center">
                      <div
                        class="flex items-center justify-center text-[11px] font-bold"
                        style={{
                          width: '21px',
                          height: '21px',
                          'border-radius': '50%',
                          border: '2px solid var(--wf-accent)',
                          background: 'var(--wf-paper-2)',
                          'line-height': '1',
                        }}
                      >
                        {i() + 1}
                      </div>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-start gap-1.5">
                        <Show when={place()}>
                          <span class="mt-0.5">
                            <CatGlyph cat={place()!.category} size={12} />
                          </span>
                        </Show>
                        <span class="flex-1 text-[12.5px] font-bold leading-tight">{s.label}</span>
                        <Show when={s.time}>
                          <span
                            class="wf-mono mt-px flex-shrink-0 text-[11px] font-bold"
                            style={{ color: 'var(--wf-muted)' }}
                          >
                            {s.time}
                          </span>
                        </Show>
                      </div>
                      <Show when={s.transit}>
                        <div class="mt-0.5 text-[11px] leading-tight" style={{ color: 'var(--wf-muted)' }}>
                          {s.transit}
                        </div>
                      </Show>
                    </div>
                  </button>
                )
              }}
            </For>
          </div>
        </Section>
      )}
    </Show>
  )
}

// ── Day stepper dock ──────────────────────────────────────
function Stepper(props: {
  activeKey: string | null
  tour: boolean
  onPick: (k: string) => void
  onStep: (dir: 1 | -1) => void
  onToggleTour: () => void
}): JSX.Element {
  return (
    <div class="flex-shrink-0 px-4 pb-3 pt-2.5" style={{ 'border-top': sB, background: 'var(--wf-paper-2)' }}>
      <div class="flex items-center gap-3">
        <div class="flex flex-shrink-0 items-center gap-1.5">
          <StepBtn onClick={() => props.onStep(-1)}>◀</StepBtn>
          <button
            type="button"
            onClick={() => props.onToggleTour()}
            class="flex items-center justify-center text-[11px]"
            style={{
              width: '28px',
              height: '28px',
              'border-radius': '50%',
              border: sB,
              background: props.tour ? 'var(--wf-accent)' : 'var(--wf-paper)',
              color: props.tour ? '#fff' : 'var(--wf-ink)',
            }}
          >
            {props.tour ? '❚❚' : '▶'}
          </button>
          <StepBtn onClick={() => props.onStep(1)}>▶</StepBtn>
        </div>
        <div style={{ width: '1px', height: '26px', background: 'var(--wf-line)' }} class="flex-shrink-0" />
        <div class="relative flex flex-1 items-stretch">
          <div
            class="absolute"
            style={{
              left: '18px',
              right: '18px',
              top: '13px',
              height: '1.5px',
              background: 'var(--wf-line)',
            }}
          />
          <For each={DAYS}>
            {(d) => {
              const on = () => d.key === props.activeKey
              return (
                <button
                  type="button"
                  onClick={() => props.onPick(d.key)}
                  class="relative z-[1] flex flex-1 flex-col items-center gap-1"
                >
                  <div
                    style={{
                      width: on() ? '16px' : '9px',
                      height: on() ? '16px' : '9px',
                      'border-radius': '50%',
                      border: sB,
                      background: on() ? 'var(--wf-accent)' : 'var(--wf-paper-2)',
                      transition: 'all .2s',
                    }}
                  />
                  <div
                    class="text-[11px]"
                    style={{
                      'font-weight': on() ? 700 : 500,
                      color: on() ? 'var(--wf-ink)' : 'var(--wf-muted)',
                    }}
                  >
                    {d.short}
                  </div>
                  <div class="wf-mono text-[9px]" style={{ color: 'var(--wf-muted)' }}>
                    {d.date.split(' ')[0]}
                  </div>
                </button>
              )
            }}
          </For>
        </div>
      </div>
    </div>
  )
}

function StepBtn(props: { children: JSX.Element; onClick: () => void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => props.onClick()}
      class="flex items-center justify-center text-[9px]"
      style={{ width: '17px', height: '17px', border: sB, 'border-radius': '4px', color: 'var(--wf-ink)' }}
    >
      {props.children}
    </button>
  )
}

// ── Map overlays ──────────────────────────────────────────
function Legend(props: {
  catOn: ReadonlySet<BerlinCategoryKey>
  toggleCat: (k: BerlinCategoryKey) => void
}): JSX.Element {
  return (
    <div
      style={{
        background: 'var(--wf-glass)',
        border: sB,
        'border-radius': '8px',
        padding: '9px 11px',
        'box-shadow': '0 2px 10px rgba(0,0,0,0.08)',
      }}
    >
      <div class="wf-mono mb-1.5 text-[9px] font-bold tracking-widest" style={{ color: 'var(--wf-muted)' }}>
        LEGEND
      </div>
      <div class="grid grid-cols-2" style={{ gap: '5px 14px' }}>
        <For each={BERLIN_CATEGORIES}>
          {(c) => (
            <button
              type="button"
              onClick={() => props.toggleCat(c.key)}
              class="flex items-center gap-1.5"
              style={{ opacity: props.catOn.has(c.key) ? 1 : 0.35 }}
            >
              <CatGlyph cat={c.key} size={13} colorOn={props.catOn.has(c.key)} />
              <span class="text-[10.5px] font-semibold" style={{ color: 'var(--wf-ink)' }}>
                {c.short}
              </span>
            </button>
          )}
        </For>
      </div>
    </div>
  )
}

function FitControl(props: {
  preset: BerlinFitPreset | null
  cluster: boolean
  onZoom: (f: number) => void
  onFit: (p: BerlinFitPreset) => void
  onToggleCluster: () => void
}): JSX.Element {
  return (
    <div class="flex flex-col items-end gap-2">
      <div
        class="flex flex-col overflow-hidden"
        style={{ border: sB, 'border-radius': '7px', background: 'var(--wf-paper-2)' }}
      >
        <button
          type="button"
          onClick={() => props.onZoom(1.6)}
          class="px-2.5 py-1 text-base font-bold leading-none"
          style={{ 'border-bottom': sB }}
        >
          ＋
        </button>
        <button
          type="button"
          onClick={() => props.onZoom(0.625)}
          class="px-2.5 py-1 text-base font-bold leading-none"
        >
          －
        </button>
      </div>
      <div
        class="overflow-hidden"
        style={{ border: sB, 'border-radius': '7px', background: 'var(--wf-paper-2)' }}
      >
        <div
          class="wf-mono px-2 pb-0.5 pt-1 text-[9px]"
          style={{ color: 'var(--wf-muted)', 'letter-spacing': '0.5px' }}
        >
          FIT TO
        </div>
        <For each={['city', 'region', 'everything'] as BerlinFitPreset[]}>
          {(f) => (
            <button
              type="button"
              onClick={() => props.onFit(f)}
              class="block w-full px-2.5 py-1 text-left text-[11px] capitalize"
              style={{
                'font-weight': props.preset === f ? 700 : 500,
                background: props.preset === f ? 'var(--wf-ink)' : 'transparent',
                color: props.preset === f ? 'var(--wf-paper)' : 'var(--wf-ink)',
                'border-top': '1px solid var(--wf-line)',
              }}
            >
              {f}
            </button>
          )}
        </For>
      </div>
      <button
        type="button"
        onClick={() => props.onToggleCluster()}
        class="wf-mono px-2 py-1 text-[9px]"
        style={{
          border: sB,
          'border-radius': '7px',
          background: props.cluster ? 'var(--wf-ink)' : 'var(--wf-paper-2)',
          color: props.cluster ? 'var(--wf-paper)' : 'var(--wf-ink)',
        }}
        title="Collapse overlapping pins into count bubbles"
      >
        CLUSTER
      </button>
    </div>
  )
}

function ScaleBar(props: { label: string }): JSX.Element {
  return (
    <div class="wf-mono flex flex-col gap-0.5 text-[9px]" style={{ color: 'var(--wf-muted)' }}>
      <div
        style={{ width: '56px', height: '5px', 'border-left': sB, 'border-right': sB, 'border-bottom': sB }}
      />
      <span>{props.label}</span>
    </div>
  )
}
