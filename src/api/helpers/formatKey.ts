/**
 * Formats a given key string by replacing underscores with spaces and capitalizing each word.
 *
 * @param {string} key - The key string to format.
 * @returns {string} - The formatted key string with each word capitalized.
 */
export function formatKey(key: string): string {
  if (!key) return ''

  const words = key.replace(/_/g, ' ').split(' ')
  const capitalizedWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  return capitalizedWords.join(' ')
}
