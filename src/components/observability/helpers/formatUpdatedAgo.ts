/** "Updated just now" / "Updated N min ago" for a query's `dataUpdatedAt` (0 means never fetched). */
export function formatUpdatedAgo(updatedAt: number, now: number): string {
  if (!updatedAt) return ''
  const minutes = Math.floor(Math.max(0, now - updatedAt) / 60_000)
  if (minutes < 1) return 'Updated just now'
  if (minutes < 60) return `Updated ${minutes} min ago`
  return `Updated ${Math.floor(minutes / 60)} h ago`
}
