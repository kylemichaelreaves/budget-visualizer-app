/** Derived metro-line list (ref + colour + network) for the map legend. */
import berlinTransitRaw from './berlinTransit.json'

export type BerlinTransitLine = {
  ref: string
  net: 'ubahn' | 'sbahn'
  color: string
}

type RawFeature = { properties?: { ref?: string; net?: string; color?: string } }

export const BERLIN_TRANSIT_LINES: readonly BerlinTransitLine[] = (
  berlinTransitRaw as unknown as { features: RawFeature[] }
).features
  .map((f) => ({
    ref: f.properties?.ref ?? '',
    net: (f.properties?.net === 'sbahn' ? 'sbahn' : 'ubahn') as 'ubahn' | 'sbahn',
    color: f.properties?.color ?? '#888',
  }))
  .filter((l) => l.ref.length > 0)
  .sort((a, b) => a.ref.localeCompare(b.ref, undefined, { numeric: true }))
