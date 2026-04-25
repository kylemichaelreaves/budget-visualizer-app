import type { JSX } from 'solid-js'
import { genealogyData } from '../../data/genealogy'
import FamilyTree from './FamilyTree'
import GenealogyMapPanel from './GenealogyMapPanel'
import { SelectionProvider } from './SelectionContext'

export default function GenealogyPage(): JSX.Element {
  return (
    <SelectionProvider>
      <section class="w-full" data-testid="genealogy-page">
        <header class="mb-4">
          <h1 class="text-2xl font-bold text-foreground">Genealogy</h1>
          <p class="text-sm text-muted-foreground">
            Reaves family lineage from William Rives (b. 1748, Surry County VA) onward. Hover any person to
            highlight their location on the map.
          </p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <GenealogyMapPanel nodes={genealogyData} />
          <div class="h-[560px]">
            <FamilyTree nodes={genealogyData} />
          </div>
        </div>
      </section>
    </SelectionProvider>
  )
}
