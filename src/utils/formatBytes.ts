/**
 * Human-readable byte size in decimal (SI) units so labels match the units
 * users see in their browsers/OSes for downloads and uploads. Integer KB
 * is floored at the boundary so values like 999_500 never render as
 * `1000 KB` — they correctly cross into MB.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1_000) return `${bytes} B`
  if (bytes < 1_000_000) return `${Math.floor(bytes / 1_000)} KB`
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}
