import type { Accessor } from 'solid-js'

export type Coords = { lat: number; lng: number }

export type GenealogyNode = {
  id: string
  fullName: string
  birthYear: number | null
  birthLocation: string
  birthCoords: Coords
  deathYear: number | null
  deathLocation: string | null
  deathCoords: Coords | null
  parentId: string | null
  spouseId: string | null
}

export type GenealogyPanel = 'map' | 'timeline'

export type SelectionState = {
  selectedId: Accessor<string | null>
  setSelectedId: (id: string | null) => void
  playheadYear: Accessor<number>
  setPlayheadYear: (year: number) => void
  activePanel: Accessor<GenealogyPanel>
  setActivePanel: (panel: GenealogyPanel) => void
}
