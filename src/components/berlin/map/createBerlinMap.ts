/**
 * D3 Berlin trip map factory — projection, base layers, and landmark pins.
 *
 * Layer stack (bottom → top under `data-role="berlin-map-root"`):
 * - `districts`       — Berlin Bezirke polygons (muted fill).
 * - `water`           — Spree / Havel rivers + canals (blue lines).
 * - `roads`           — motorway/trunk citywide + central primary streets.
 * - `transit`         — U-Bahn & S-Bahn lines, coloured by official line colour.
 * - `district-labels` — subtle Bezirk names.
 * - `markers`         — one pin per place: a coloured circle + a white glyph.
 *
 * Line layers use `vector-effect: non-scaling-stroke` so their widths stay
 * constant on screen while zooming. Zoom transforms the whole `root` group;
 * each marker counter-scales by `1/k` so pins keep a constant screen size.
 */
import * as d3 from 'd3'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import berlinDistrictsRaw from '../data/berlinDistricts.json'
import berlinWaterRaw from '../data/berlinWater.json'
import berlinRoadsRaw from '../data/berlinRoads.json'
import berlinTransitRaw from '../data/berlinTransit.json'
import {
  BERLIN_CATEGORY_BY_KEY,
  BERLIN_CATEGORIES,
  type BerlinCategoryKey,
  type BerlinPlace,
} from '../data/berlinPlaces'

export type BerlinMapCallbacks = {
  onEnter: (place: BerlinPlace, event: PointerEvent) => void
  onMove: (place: BerlinPlace, event: PointerEvent) => void
  onLeave: () => void
  onClick: (place: BerlinPlace) => void
}

export type BerlinMapLayers = {
  streets: boolean
  water: boolean
  metro: boolean
}

export type BerlinMapHandle = {
  setSelected: (id: string | null) => void
  setVisibleCategories: (keys: ReadonlySet<BerlinCategoryKey>) => void
  setLayers: (layers: BerlinMapLayers) => void
  /** Smoothly zoom to a single place and select it. */
  focusPlace: (id: string) => void
  /** Reset the viewport to the whole-city fit. */
  resetView: () => void
  destroy: () => void
}

const PADDING = 28
const MARKER_R = 13
const CLICK_DISTANCE_PX_SQ = 25
const ZOOM_TRANSITION_MS = 600

type DistrictProps = { name: string }
type LineProps = { c?: string; ref?: string; net?: string; color?: string }

const districts = berlinDistrictsRaw as unknown as FeatureCollection<Geometry, DistrictProps>
const water = berlinWaterRaw as unknown as FeatureCollection<Geometry, LineProps>
const roads = berlinRoadsRaw as unknown as FeatureCollection<Geometry, LineProps>
const transit = berlinTransitRaw as unknown as FeatureCollection<Geometry, LineProps>

export function createBerlinMap(
  svgEl: SVGSVGElement,
  places: readonly BerlinPlace[],
  width: number,
  height: number,
  callbacks: BerlinMapCallbacks,
): BerlinMapHandle {
  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()
  svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height)

  // Marker positions as GeoJSON points so the projection fit includes outliers
  // (e.g. Sachsenhausen north of the city, Wannsee/BER to the south).
  const placePoints: Feature<Geometry>[] = places.map((p) => ({
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
  }))
  const fitTarget: FeatureCollection<Geometry> = {
    type: 'FeatureCollection',
    features: [...districts.features, ...placePoints] as Feature<Geometry>[],
  }

  const projection = d3.geoMercator().fitExtent(
    [
      [PADDING, PADDING],
      [width - PADDING, height - PADDING],
    ],
    fitTarget,
  )
  const path = d3.geoPath(projection)

  // Per-category glyph symbols, drawn white inside each pin.
  const defs = svg.append('defs')
  for (const cat of BERLIN_CATEGORIES) {
    defs
      .append('symbol')
      .attr('id', `berlin-icon-${cat.key}`)
      .attr('viewBox', '0 0 24 24')
      .append('path')
      .attr('d', cat.iconPath)
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
  }

  const root = svg.append('g').attr('data-role', 'berlin-map-root')

  // District polygons.
  root
    .append('g')
    .attr('data-role', 'districts')
    .selectAll('path')
    .data(districts.features)
    .join('path')
    .attr('d', (f) => path(f) ?? '')
    .attr('fill', 'var(--muted)')
    .attr('fill-opacity', 0.5)
    .attr('stroke', 'var(--border)')
    .attr('stroke-width', 1)
    .attr('vector-effect', 'non-scaling-stroke')

  // Water — rivers thicker than canals.
  const waterLayer = root.append('g').attr('data-role', 'water')
  waterLayer
    .selectAll('path')
    .data(water.features)
    .join('path')
    .attr('d', (f) => path(f) ?? '')
    .attr('fill', 'none')
    .attr('stroke', '#3b82f6')
    .attr('stroke-opacity', 0.7)
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
    .attr('stroke-width', (f) => (f.properties.c === 'canal' ? 1.4 : 3))
    .attr('vector-effect', 'non-scaling-stroke')

  // Roads — major (motorway/trunk) bolder than central primary streets.
  const roadsLayer = root.append('g').attr('data-role', 'roads')
  roadsLayer
    .selectAll('path')
    .data(roads.features)
    .join('path')
    .attr('d', (f) => path(f) ?? '')
    .attr('fill', 'none')
    .attr('stroke', 'var(--muted-foreground)')
    .attr('stroke-opacity', (f) => (f.properties.c === 'major' ? 0.55 : 0.3))
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
    .attr('stroke-width', (f) => (f.properties.c === 'major' ? 1.6 : 0.8))
    .attr('vector-effect', 'non-scaling-stroke')

  // Transit — U-Bahn solid, S-Bahn dashed, each in its official line colour.
  const transitLayer = root.append('g').attr('data-role', 'transit')
  transitLayer
    .selectAll('path')
    .data(transit.features)
    .join('path')
    .attr('d', (f) => path(f) ?? '')
    .attr('fill', 'none')
    .attr('stroke', (f) => f.properties.color ?? '#888')
    .attr('stroke-opacity', 0.9)
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
    .attr('stroke-width', 1.8)
    .attr('stroke-dasharray', (f) => (f.properties.net === 'sbahn' ? '5 4' : null))
    .attr('vector-effect', 'non-scaling-stroke')

  // District name labels at polygon centroids. Counter-scaled on zoom (see
  // `applyLabelTransforms`) so they stay legible instead of ballooning.
  const labelCentroids = districts.features.map((f) => path.centroid(f))
  const labels = root
    .append('g')
    .attr('data-role', 'district-labels')
    .attr('pointer-events', 'none')
    .selectAll<SVGTextElement, DistrictProps>('text')
    .data(districts.features)
    .join('text')
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--muted-foreground)')
    .attr('font-size', 9)
    .attr('opacity', 0.6)
    .text((f) => f.properties.name)

  function applyLabelTransforms(): void {
    const k = currentZoomK
    labels.attr('transform', (_f, i) => {
      const [cx, cy] = labelCentroids[i]
      return `translate(${cx},${cy}) scale(${1 / k})`
    })
  }

  const markersLayer = root.append('g').attr('data-role', 'markers')

  let currentZoomK = 1
  let selectedId: string | null = null
  let visibleCategories: ReadonlySet<BerlinCategoryKey> = new Set(BERLIN_CATEGORIES.map((c) => c.key))

  const projected = new Map<string, [number, number]>()
  for (const p of places) {
    const xy = projection([p.lng, p.lat])
    if (xy) projected.set(p.id, xy)
  }

  const markers = markersLayer
    .selectAll<SVGGElement, BerlinPlace>('g')
    .data(places, (p) => p.id)
    .join('g')
    .attr('data-place-id', (p) => p.id)
    .attr('cursor', 'pointer')
    .attr('aria-label', (p) => p.name)

  markers.each(function (p) {
    const g = d3.select(this)
    const cat = BERLIN_CATEGORY_BY_KEY[p.category]
    g.append('circle')
      .attr('r', MARKER_R)
      .attr('fill', cat.color)
      .attr('stroke', 'var(--background)')
      .attr('stroke-width', 2)
    g.append('use')
      .attr('href', `#berlin-icon-${p.category}`)
      .attr('x', -8)
      .attr('y', -8)
      .attr('width', 16)
      .attr('height', 16)
      .attr('pointer-events', 'none')
  })

  function applyMarkerTransforms(): void {
    const k = currentZoomK
    markers.attr('transform', (p) => {
      const xy = projected.get(p.id)
      if (!xy) return 'translate(-9999,-9999)'
      return `translate(${xy[0]},${xy[1]}) scale(${1 / k})`
    })
  }

  function applyMarkerVisualState(): void {
    markers
      .attr('display', (p) => (visibleCategories.has(p.category) ? null : 'none'))
      .attr('opacity', (p) => (selectedId === null || p.id === selectedId ? 1 : 0.35))
    markers
      .select('circle')
      .attr('stroke', (p) => (p.id === selectedId ? 'var(--foreground)' : 'var(--background)'))
      .attr('stroke-width', (p) => (p.id === selectedId ? 3 : 2))
  }

  let pointerDown: { x: number; y: number; id: string } | null = null
  markers
    .on('pointerenter', (event: PointerEvent, p) => callbacks.onEnter(p, event))
    .on('pointermove', (event: PointerEvent, p) => callbacks.onMove(p, event))
    .on('pointerleave', () => callbacks.onLeave())
    .on('pointerdown', (event: PointerEvent, p) => {
      pointerDown = { x: event.clientX, y: event.clientY, id: p.id }
    })
    .on('pointerup', (event: PointerEvent, p) => {
      const start = pointerDown
      pointerDown = null
      if (!start || start.id !== p.id) return
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      if (dx * dx + dy * dy > CLICK_DISTANCE_PX_SQ) return
      callbacks.onClick(p)
    })

  applyMarkerTransforms()
  applyMarkerVisualState()
  applyLabelTransforms()

  const zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.8, 12])
    .on('zoom', (event) => {
      currentZoomK = event.transform.k
      root.attr('transform', event.transform.toString())
      applyMarkerTransforms()
      applyLabelTransforms()
    })

  svg.call(zoomBehavior)

  function zoomTo(x: number, y: number, k: number): void {
    const transform = d3.zoomIdentity.translate(width / 2 - x * k, height / 2 - y * k).scale(k)
    svg.transition().duration(ZOOM_TRANSITION_MS).call(zoomBehavior.transform, transform)
  }

  function setSelected(id: string | null): void {
    selectedId = id
    applyMarkerVisualState()
  }

  function setVisibleCategories(keys: ReadonlySet<BerlinCategoryKey>): void {
    visibleCategories = keys
    applyMarkerVisualState()
  }

  function setLayers(layers: BerlinMapLayers): void {
    roadsLayer.attr('display', layers.streets ? null : 'none')
    waterLayer.attr('display', layers.water ? null : 'none')
    transitLayer.attr('display', layers.metro ? null : 'none')
  }

  function focusPlace(id: string): void {
    const xy = projected.get(id)
    if (!xy) return
    setSelected(id)
    zoomTo(xy[0], xy[1], 5)
  }

  function resetView(): void {
    setSelected(null)
    svg.transition().duration(ZOOM_TRANSITION_MS).call(zoomBehavior.transform, d3.zoomIdentity)
  }

  function destroy(): void {
    svg.on('.zoom', null)
    svg.selectAll('*').remove()
  }

  return { setSelected, setVisibleCategories, setLayers, focusPlace, resetView, destroy }
}
