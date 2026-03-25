import type { Categories, CategoryNode } from '@types'

/**
 * convertToTree: converts the nested categories object into a tree of CategoryNodes.
 * This function handles the actual structure returned by the API: a nested object where
 * each key is a category name and the value contains subcategories.
 *
 * @param {Categories} categories - The categories object to convert into a tree.
 * @param {string} parentPath - The path of parent categories, used to create unique values.
 * @returns {CategoryNode[]} - An array of CategoryNodes representing the tree.
 */
// used by BudgetCategoryTreeSelect
export function convertToTree(categories: Categories, parentPath: string = ''): CategoryNode[] {
  return Object.keys(categories).map((categoryName) => {
    // Create a unique value path for this category
    const currentPath = parentPath ? `${parentPath} - ${categoryName}` : categoryName

    const subcategories = categories[categoryName]

    // If there are subcategories, recursively process them
    // Add proper null/undefined checks before calling Object.keys and recursive function
    const children =
      subcategories && typeof subcategories === 'object' && Object.keys(subcategories).length > 0
        ? convertToTree(subcategories, currentPath)
        : undefined

    // Return a CategoryNode
    return {
      value: currentPath, // Use the full path as the value
      label: categoryName, // Just the category name as the label
      ...(children && { children }),
    }
  })
}
