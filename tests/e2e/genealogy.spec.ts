import { authenticatedTest as test, expect } from './fixtures/fixtures'
import { GENEALOGY_NODE_IDS } from './pages/GenealogyPage'

test.describe('Genealogy page', () => {
  test('sidebar exposes a Genealogy section with a Family Tree link', async ({ page, sidebar }) => {
    await page.goto('/budget-visualizer/transactions')
    await expect(sidebar.budgetSectionHeading).toBeVisible()
    await expect(sidebar.genealogySectionHeading).toBeVisible()
    await expect(sidebar.genealogyLink).toBeVisible()
  })

  test('navigating to Genealogy renders heading and both panels', async ({
    page,
    sidebar,
    genealogyPage,
  }) => {
    await page.goto('/budget-visualizer/transactions')
    await sidebar.navigateToGenealogy()
    await expect(page).toHaveURL(/\/budget-visualizer\/genealogy$/)
    await expect(genealogyPage.heading).toBeVisible()
    await expect(genealogyPage.mapPanel).toBeVisible()
    await expect(genealogyPage.familyTree).toBeVisible()
  })

  test('family tree renders one card per seed ancestor', async ({ genealogyPage }) => {
    await genealogyPage.goto()
    await expect(genealogyPage.personCards).toHaveCount(GENEALOGY_NODE_IDS.length)
    for (const id of GENEALOGY_NODE_IDS) {
      await expect(genealogyPage.personCard(id)).toBeVisible()
    }
  })

  test('map renders southern-state shapes, connectors, and one circle per ancestor', async ({
    genealogyPage,
  }) => {
    await genealogyPage.goto()
    await expect(genealogyPage.mapSvg).toBeVisible()
    // Six ancestors have a non-null parentId in the seed data, so six connector paths render.
    const connectorCount = GENEALOGY_NODE_IDS.length - 1
    await expect(genealogyPage.connectorPaths).toHaveCount(connectorCount)
    await expect(genealogyPage.mapCircles).toHaveCount(GENEALOGY_NODE_IDS.length)
    // At least the 14 southern-state FIPS filter should yield a meaningful count;
    // topojson sometimes splits disjoint geometries so allow >= 14.
    await expect.poll(async () => await genealogyPage.stateShapes.count()).toBeGreaterThanOrEqual(14)
  })

  test('historical county TopoJSON loads from S3 for states used in the tree', async ({ genealogyPage }) => {
    await genealogyPage.goto()
    await expect
      .poll(async () => await genealogyPage.historicalCountyPaths.count(), { timeout: 15_000 })
      .toBeGreaterThan(0)
  })

  test('hovering a person card selects the matching map node and shows the tree tooltip', async ({
    genealogyPage,
  }) => {
    await genealogyPage.goto()
    const targetId = 'john-sr'

    // Nothing selected initially — every circle reports data-selected=false.
    await expect(genealogyPage.selectedMapNode).toHaveCount(0)

    await genealogyPage.personCard(targetId).hover()
    // Cross-panel sync: the map node for the hovered card becomes the selected one.
    await expect(genealogyPage.selectedMapNode).toHaveCount(1)
    await expect(genealogyPage.mapNode(targetId)).toHaveAttribute('data-selected', 'true')

    // The tooltip that appears belongs to the tree panel, not the map panel.
    await expect(genealogyPage.treeTooltip).toBeVisible()
    await expect(genealogyPage.treeTooltip).toContainText('John Anderson Reaves Sr.')
    await expect(genealogyPage.mapTooltip).toBeHidden()
  })

  test('moving off the card clears selection and hides the tooltip', async ({ genealogyPage }) => {
    await genealogyPage.goto()
    const card = genealogyPage.personCard('lee-reaves')

    await card.hover()
    await expect(genealogyPage.selectedMapNode).toHaveCount(1)
    await expect(genealogyPage.treeTooltip).toBeVisible()

    await genealogyPage.heading.hover()
    await expect(genealogyPage.treeTooltip).toBeHidden()
    await expect(genealogyPage.selectedMapNode).toHaveCount(0)
  })

  test('timeline axis and rail are visible by default', async ({ genealogyPage }) => {
    await genealogyPage.goto()
    await expect(genealogyPage.timelineAxis).toBeVisible()
    await expect(genealogyPage.timelineOverlay).toBeVisible()
  })

  test('timeline next control advances the displayed year', async ({ genealogyPage }) => {
    await genealogyPage.goto()
    await expect(genealogyPage.timelineOverlay).toBeVisible()
    const y0 = await genealogyPage.timelineYear.textContent()
    await genealogyPage.timelineNext.click()
    const y1 = await genealogyPage.timelineYear.textContent()
    expect(y0).toBeTruthy()
    expect(y1).not.toBe(y0)
  })
})
