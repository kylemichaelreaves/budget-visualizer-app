import type { Locator, Page } from '@playwright/test'

/** Node ids from src/data/genealogy.ts — kept in sync with the seed data. */
export const GENEALOGY_NODE_IDS = [
  'william-rives',
  'edmond-reaves',
  'ransom-reaves',
  'john-sr',
  'john-jr',
  'lee-reaves',
  'john-franklin',
] as const

export type GenealogyNodeId = (typeof GENEALOGY_NODE_IDS)[number]

export class GenealogyPage {
  readonly page: Page
  readonly root: Locator
  readonly heading: Locator
  readonly mapPanel: Locator
  readonly mapSvg: Locator
  readonly mapStatesGroup: Locator
  readonly mapNodesGroup: Locator
  readonly mapConnectorsGroup: Locator
  readonly familyTree: Locator
  readonly timelineToggle: Locator
  readonly tooltip: Locator

  constructor(page: Page) {
    this.page = page
    this.root = page.getByTestId('genealogy-page')
    this.heading = this.root.getByRole('heading', { name: /^genealogy$/i, level: 1 })
    this.mapPanel = page.getByTestId('genealogy-map-panel')
    this.mapSvg = page.getByTestId('genealogy-map').locator('svg')
    this.mapStatesGroup = this.mapSvg.locator('g[data-role="states"]')
    this.mapNodesGroup = this.mapSvg.locator('g[data-role="nodes"]')
    this.mapConnectorsGroup = this.mapSvg.locator('g[data-role="connectors"]')
    this.familyTree = page.getByTestId('genealogy-family-tree')
    this.timelineToggle = page.getByTestId('genealogy-timeline-toggle')
    this.tooltip = page.getByTestId('genealogy-tooltip')
  }

  async goto() {
    await this.page.goto('/budget-visualizer/genealogy')
  }

  personCard(id: GenealogyNodeId): Locator {
    return this.familyTree.getByTestId(`genealogy-person-${id}`)
  }

  mapNode(id: GenealogyNodeId): Locator {
    return this.mapNodesGroup.locator(`circle[data-node-id="${id}"]`)
  }

  get personCards(): Locator {
    return this.familyTree.locator('[data-testid^="genealogy-person-"]')
  }

  get mapCircles(): Locator {
    return this.mapNodesGroup.locator('circle[data-node-id]')
  }

  get stateShapes(): Locator {
    return this.mapStatesGroup.locator('path')
  }

  get connectorPaths(): Locator {
    return this.mapConnectorsGroup.locator('path')
  }
}
