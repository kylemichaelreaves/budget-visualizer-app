import * as d3 from 'd3'
import type { BudgetCategorySummary } from '@types'
import { getCssChartFallbackColor, getCssChartPalette } from '@utils/chartPalette'

/**
 * Returns `count` visually-distinct base colors. When the seeded theme palette has more slots than
 * needed, we use it as-is (so the CSS chart tokens still win); when it is short, we sample
 * `d3.interpolateRainbow` so every parent gets a unique hue rather than wrapping back to chart-1.
 */
function buildDistinctBasePalette(count: number, seed: string[]): string[] {
  if (count <= 0) return []
  if (count <= seed.length) return seed.slice(0, count)
  return d3.quantize((t) => d3.interpolateRainbow((t + 0.05) % 1), count)
}

/**
 * Build a color map for budget categories.
 *
 * Each coloring root (top-level categories, plus any category whose `parent_id` isn't present in
 * this dataset) gets a distinct base hue. Every descendant inherits a shade of its root's hue —
 * darker with depth, offset by sibling index so siblings differ. This keeps the tree visually
 * grouped (all Food subcategories read as Food) while avoiding two unrelated parents sharing
 * the same color.
 */
export function buildBudgetCategoryColorMap(data: BudgetCategorySummary[] | undefined): Map<string, string> {
  const colorMap = new Map<string, string>()
  if (!data?.length) return colorMap

  const categoriesWithData = data.filter((cat) => Math.abs(cat.total_amount_debit) > 0)
  const byId = new Map<number, BudgetCategorySummary>(categoriesWithData.map((cat) => [cat.category_id, cat]))
  const childrenByParent = new Map<number, BudgetCategorySummary[]>()
  for (const cat of categoriesWithData) {
    if (cat.parent_id == null) continue
    const arr = childrenByParent.get(cat.parent_id) ?? []
    arr.push(cat)
    childrenByParent.set(cat.parent_id, arr)
  }

  /** True roots for coloring: top-level, or whose parent isn't visible in this slice. */
  const roots = categoriesWithData.filter((cat) => cat.parent_id == null || !byId.has(cat.parent_id))

  const cssPalette = getCssChartPalette()
  const seedPalette = cssPalette.length >= 5 ? cssPalette : d3.schemeCategory10.concat(d3.schemeSet2)
  const baseColors = buildDistinctBasePalette(roots.length, seedPalette)

  function setColor(cat: BudgetCategorySummary, color: string) {
    if (cat.category_id != null) colorMap.set(String(cat.category_id), color)
    if (cat.category_name) colorMap.set(cat.category_name, color)
    if (cat.budget_category) colorMap.set(cat.budget_category, color)
    if (cat.full_path) colorMap.set(cat.full_path, color)
  }

  function paintSubtree(node: BudgetCategorySummary, baseColor: string, depth: number, siblingIndex: number) {
    let color = baseColor
    if (depth > 0) {
      const shade = d3.color(baseColor)?.darker(0.3 * depth + 0.15 * siblingIndex)
      if (shade) color = shade.toString()
    }
    setColor(node, color)
    const children = childrenByParent.get(node.category_id) ?? []
    children.forEach((child, i) => paintSubtree(child, baseColor, depth + 1, i))
  }

  roots.forEach((root, rootIndex) => {
    const baseColor = baseColors[rootIndex]
    if (baseColor) paintSubtree(root, baseColor, 0, 0)
  })

  return colorMap
}

export type BudgetCategoryColorHelpers = ReturnType<typeof budgetCategoryColorsFromData>

/**
 * Treemap uses the same {@link BudgetCategoryColorHelpers} as transaction pills when the chart slice
 * has already materialized the summary query; if the forwarded map is still empty while summary
 * rows exist (timing), derive colors from those rows so cells are not all fallback grey.
 */
export function chartCategoryColorsWithSummaryFallback(
  forwarded: BudgetCategoryColorHelpers,
  summaryRows: BudgetCategorySummary[],
): BudgetCategoryColorHelpers {
  if (forwarded.colorScheme().size > 0 || summaryRows.length === 0) {
    return forwarded
  }
  return budgetCategoryColorsFromData(summaryRows)
}

export function budgetCategoryColorsFromData(data: BudgetCategorySummary[] | undefined) {
  /** One map per summary snapshot — do not rebuild inside getColorByName (hot path for many rows). */
  const map = buildBudgetCategoryColorMap(data)

  const fallback = getCssChartFallbackColor()

  const getColorByName = (categoryName?: string): string => {
    if (!categoryName) return 'transparent'
    return map.get(categoryName) || fallback
  }

  const getColorById = (categoryId?: number): string => {
    if (!categoryId) return 'transparent'
    return map.get(String(categoryId)) || fallback
  }

  return { getColorByName, getColorById, colorScheme: () => map }
}

/**
 * Treemap / sunburst fills aligned with {@link TransactionsTableRowCategoryColumn} pills, which use
 * `getColorByName(String(row().budget_category))`. We try several path-shaped keys against the raw map
 * so a mismatched `full_path` does not force the grey fallback before `budget_category` / id are tried.
 */
export function getBudgetCategoryColorForChartCell(
  helpers: BudgetCategoryColorHelpers,
  row: Pick<BudgetCategorySummary, 'category_id' | 'full_path' | 'budget_category' | 'category_name'>,
): string {
  const map = helpers.colorScheme()
  const keys = [row.budget_category, row.full_path, row.category_name]
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter((s, i, arr) => s !== '' && arr.indexOf(s) === i)

  let base: string | undefined
  for (const k of keys) {
    const hit = map.get(k)
    if (hit) {
      base = hit
      break
    }
  }

  if (!base && row.category_id != null && row.category_id !== 0) {
    base = map.get(String(row.category_id))
  }

  if (!base) base = getCssChartFallbackColor()

  if (row.category_id < 0) {
    const parsed = d3.color(base)
    if (parsed) return parsed.darker(0.38).formatHex()
  }
  return base
}
