import * as d3 from 'd3'
import type { BudgetCategorySummary } from '@types'

/** Same color assignment logic as the Vue `useBudgetCategoryColors` composable. */
export function buildBudgetCategoryColorMap(data: BudgetCategorySummary[] | undefined): Map<string, string> {
  const colorMap = new Map<string, string>()
  if (!data?.length) return colorMap

  const categoriesWithData = data.filter((cat) => Math.abs(cat.total_amount_debit) > 0)
  const parentCategories = categoriesWithData.filter((cat) => cat.parent_id === null)

  const baseColors = d3.schemeCategory10.concat(d3.schemeSet2)

  function setColor(cat: BudgetCategorySummary, color: string) {
    if (cat.category_id != null) colorMap.set(String(cat.category_id), color)
    if (cat.category_name) colorMap.set(cat.category_name, color)
    if (cat.budget_category) colorMap.set(cat.budget_category, color)
    if (cat.full_path) colorMap.set(cat.full_path, color)
  }

  parentCategories.forEach((parent, index) => {
    const baseColor = baseColors[index % baseColors.length]
    if (baseColor) setColor(parent, baseColor)
    const children = categoriesWithData.filter((cat) => cat.parent_id === parent.category_id)
    children.forEach((child, childIndex) => {
      const shade = d3.color(baseColor as string)?.darker(0.3 + childIndex * 0.2)
      const childColor = shade ? shade.toString() : baseColor
      if (childColor) setColor(child, childColor)
    })
  })

  const orphanedCategories = categoriesWithData.filter(
    (cat) => cat.category_id != null && !colorMap.has(String(cat.category_id)),
  )

  orphanedCategories.forEach((orphan, index) => {
    const colorIndex = parentCategories.length + index
    const orphanColor = baseColors[colorIndex % baseColors.length]
    if (orphanColor) setColor(orphan, orphanColor)
  })

  return colorMap
}

export function budgetCategoryColorsFromData(data: BudgetCategorySummary[] | undefined) {
  const colorScheme = () => buildBudgetCategoryColorMap(data)

  const getColorByName = (categoryName?: string): string => {
    if (!categoryName) return 'transparent'
    return colorScheme().get(categoryName) || '#999999'
  }

  const getColorById = (categoryId?: number): string => {
    if (!categoryId) return 'transparent'
    return colorScheme().get(String(categoryId)) || '#999999'
  }

  return { getColorByName, getColorById, colorScheme }
}
