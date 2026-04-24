import type { JSX } from 'solid-js'
import { createContext, createSignal, useContext } from 'solid-js'
import type { GenealogyPanel, SelectionState } from '../../types/genealogy'

const SelectionContext = createContext<SelectionState>()

export function SelectionProvider(props: { children: JSX.Element }) {
  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [playheadYear, setPlayheadYear] = createSignal(1748)
  const [activePanel, setActivePanel] = createSignal<GenealogyPanel>('map')

  const value: SelectionState = {
    selectedId,
    setSelectedId,
    playheadYear,
    setPlayheadYear,
    activePanel,
    setActivePanel,
  }

  return <SelectionContext.Provider value={value}>{props.children}</SelectionContext.Provider>
}

export function useSelection(): SelectionState {
  const ctx = useContext(SelectionContext)
  if (!ctx) throw new Error('useSelection must be used within a SelectionProvider')
  return ctx
}
