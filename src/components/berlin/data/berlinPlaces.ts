/**
 * Static data for the Berlin trip map.
 *
 * Each place has true WGS84 coordinates ([lng, lat] order when projected) and a
 * category. Categories carry a display label, a marker colour, and a 24×24 SVG
 * glyph path rendered inside each pin (see `createBerlinMap.ts`). Colours are
 * fixed hexes so the SVG markers and the HTML legend/list stay in sync.
 */

export type BerlinCategoryKey = 'base' | 'philosophy' | 'history' | 'stationery' | 'craft' | 'transit'

export type BerlinCategory = {
  key: BerlinCategoryKey
  label: string
  /** Marker fill + legend swatch. */
  color: string
  /** 24×24 viewBox path(s) drawn in white inside the pin. */
  iconPath: string
}

export type BerlinPlace = {
  id: string
  name: string
  category: BerlinCategoryKey
  lat: number
  lng: number
}

export const BERLIN_CATEGORIES: readonly BerlinCategory[] = [
  {
    key: 'base',
    label: 'Base & work',
    color: '#0ea5e9',
    // bed
    iconPath: 'M3 7v10M3 12h15a3 3 0 0 1 3 3v2M3 17h18M7 12V9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3',
  },
  {
    key: 'philosophy',
    label: 'Philosophy & humanities',
    color: '#8b5cf6',
    // open book
    iconPath: 'M12 6c-2-1.3-4.7-2-7-2v13c2.3 0 5 .7 7 2 2-1.3 4.7-2 7-2V4c-2.3 0-5 .7-7 2zM12 6v13',
  },
  {
    key: 'history',
    label: 'History — WWII & Cold War',
    color: '#ef4444',
    // monument / classical building
    iconPath: 'M3 21h18M4 21V10h16v11M4 10l8-6 8 6M9 21v-7h6v7',
  },
  {
    key: 'stationery',
    label: 'Stationery',
    color: '#f59e0b',
    // pen
    iconPath: 'M4 20l4-1 11-11-3-3L5 16l-1 4zM14 5l3 3',
  },
  {
    key: 'craft',
    label: 'For mom (craft)',
    color: '#ec4899',
    // scissors
    iconPath:
      'M6 6a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM6 13a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM8.2 9.8L20 18M8.2 14.2L20 6',
  },
  {
    key: 'transit',
    label: 'Transit anchor',
    color: '#10b981',
    // train
    iconPath:
      'M6 4h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM4 11h16M8.5 19l-1.5 2M15.5 19l1.5 2M9 14h.01M15 14h.01',
  },
]

export const BERLIN_CATEGORY_BY_KEY: Record<BerlinCategoryKey, BerlinCategory> = Object.fromEntries(
  BERLIN_CATEGORIES.map((c) => [c.key, c]),
) as Record<BerlinCategoryKey, BerlinCategory>

export const BERLIN_PLACES: readonly BerlinPlace[] = [
  { id: 'hilton', name: 'Hilton Berlin (Gendarmenmarkt)', category: 'base', lat: 52.5122, lng: 13.3929 },
  { id: 'babbel', name: 'Babbel office (Friedrichshain)', category: 'base', lat: 52.5121, lng: 13.4307 },
  {
    id: 'hegel-grave',
    name: "Hegel's grave, Dorotheenstadt Cemetery",
    category: 'philosophy',
    lat: 52.5281,
    lng: 13.3841,
  },
  { id: 'brecht-weigel', name: 'Brecht-Weigel Memorial', category: 'philosophy', lat: 52.5289, lng: 13.3847 },
  { id: 'humboldt-uni', name: 'Humboldt University', category: 'philosophy', lat: 52.5179, lng: 13.3937 },
  {
    id: 'bebelplatz',
    name: 'Bebelplatz (book-burning memorial)',
    category: 'philosophy',
    lat: 52.5165,
    lng: 13.3939,
  },
  { id: 'neue-wache', name: 'Neue Wache', category: 'philosophy', lat: 52.5179, lng: 13.3955 },
  {
    id: 'museum-island',
    name: 'Museum Island / Bode-Museum',
    category: 'philosophy',
    lat: 52.522,
    lng: 13.3944,
  },
  { id: 'humboldt-forum', name: 'Humboldt Forum', category: 'philosophy', lat: 52.5173, lng: 13.4017 },
  { id: 'dhm', name: 'German Historical Museum', category: 'philosophy', lat: 52.5186, lng: 13.3964 },
  {
    id: 'staatsbibliothek',
    name: 'Staatsbibliothek (Potsdamer Str.)',
    category: 'philosophy',
    lat: 52.5076,
    lng: 13.3708,
  },
  {
    id: 'grimm-zentrum',
    name: 'Grimm-Zentrum (HU library)',
    category: 'philosophy',
    lat: 52.5202,
    lng: 13.387,
  },
  { id: 'reichstag', name: 'Reichstag', category: 'history', lat: 52.5186, lng: 13.3762 },
  { id: 'brandenburg-gate', name: 'Brandenburg Gate', category: 'history', lat: 52.5163, lng: 13.3777 },
  {
    id: 'holocaust-memorial',
    name: 'Memorial to the Murdered Jews of Europe',
    category: 'history',
    lat: 52.5139,
    lng: 13.3787,
  },
  { id: 'fuhrerbunker', name: 'Führerbunker site', category: 'history', lat: 52.5125, lng: 13.381 },
  { id: 'topography-terror', name: 'Topography of Terror', category: 'history', lat: 52.5067, lng: 13.3837 },
  { id: 'checkpoint-charlie', name: 'Checkpoint Charlie', category: 'history', lat: 52.5074, lng: 13.3904 },
  { id: 'east-side-gallery', name: 'East Side Gallery', category: 'history', lat: 52.505, lng: 13.4397 },
  { id: 'mauerpark', name: 'Mauerpark (flea market)', category: 'history', lat: 52.5427, lng: 13.4027 },
  { id: 'jewish-museum', name: 'Jewish Museum', category: 'history', lat: 52.5023, lng: 13.3954 },
  {
    id: 'resistance-memorial',
    name: 'German Resistance Memorial Center',
    category: 'history',
    lat: 52.5077,
    lng: 13.3629,
  },
  { id: 'stasi-museum', name: 'Stasi Museum', category: 'history', lat: 52.5145, lng: 13.4873 },
  {
    id: 'hohenschonhausen',
    name: 'Hohenschönhausen Memorial (Stasi Prison)',
    category: 'history',
    lat: 52.5418,
    lng: 13.5002,
  },
  { id: 'sachsenhausen', name: 'Sachsenhausen Memorial', category: 'history', lat: 52.7659, lng: 13.2642 },
  { id: 'wannsee', name: 'House of the Wannsee Conference', category: 'history', lat: 52.4329, lng: 13.1654 },
  { id: 'luiban', name: 'LUIBAN Papeterie', category: 'stationery', lat: 52.5257, lng: 13.4111 },
  { id: 'rsvp', name: 'R.S.V.P. Papier', category: 'stationery', lat: 52.5274, lng: 13.4051 },
  { id: 'wollen', name: 'WOLLEN Berlin (yarn)', category: 'craft', lat: 52.5438, lng: 13.3679 },
  { id: 'takaay', name: 'Takaay Perlen-Atelier (beads)', category: 'craft', lat: 52.4905, lng: 13.4264 },
  { id: 'ber-airport', name: 'BER Airport', category: 'transit', lat: 52.3648, lng: 13.512 },
  { id: 'hauptbahnhof', name: 'Berlin Hauptbahnhof', category: 'transit', lat: 52.5251, lng: 13.3694 },
  { id: 'friedrichstrasse', name: 'Friedrichstraße', category: 'transit', lat: 52.5202, lng: 13.387 },
  { id: 'stadtmitte', name: 'Stadtmitte (U2/U6)', category: 'transit', lat: 52.5108, lng: 13.3897 },
  { id: 'alexanderplatz', name: 'Alexanderplatz', category: 'transit', lat: 52.5219, lng: 13.4132 },
]
