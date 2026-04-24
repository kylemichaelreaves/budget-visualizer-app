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
    // topojson sometimes splits disjoint islands so allow >= 14.
    await expect.poll(async () => await genealogyPage.stateShapes.count()).toBeGreaterThanOrEqual(14)
  })

  test('hovering a person card highlights the matching map node', async ({ genealogyPage }) => {
    await genealogyPage.goto()
    const targetId = 'john-sr'
    const card = genealogyPage.personCard(targetId)
    const circle = genealogyPage.mapNode(targetId)

    await expect(circle).toHaveAttribute('r', '6')
    await card.hover()
    // Cross-panel sync: the map circle enlarges via the setSelected() handle.
    await expect(circle).toHaveAttribute('r', '9')
    await expect(genealogyPage.tooltip).toBeVisible()
    await expect(genealogyPage.tooltip).toContainText('John Anderson Reaves Sr.')
  })

  test('moving off the card clears selection and hides the tooltip', async ({ genealogyPage }) => {
    await genealogyPage.goto()
    const card = genealogyPage.personCard('lee-reaves')
    const circle = genealogyPage.mapNode('lee-reaves')

    await card.hover()
    await expect(circle).toHaveAttribute('r', '9')
    await expect(genealogyPage.tooltip).toBeVisible()

    await genealogyPage.heading.hover()
    await expect(genealogyPage.tooltip).toBeHidden()
    await expect(circle).toHaveAttribute('r', '6')
  })

  test('timeline toggle is present but disabled (Phase 2)', async ({ genealogyPage }) => {
    await genealogyPage.goto()
    await expect(genealogyPage.timelineToggle).toBeVisible()
    await expect(genealogyPage.timelineToggle).toBeDisabled()
    await expect(genealogyPage.timelineToggle).toContainText(/coming soon/i)
  })
})
