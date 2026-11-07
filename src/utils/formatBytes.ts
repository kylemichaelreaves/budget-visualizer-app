/**
 * Human-readable byte size in decimal (SI) units so labels match the units
 * users see in their browsers/OSes for downloads and uploads. The MB cutoff
 * is at 1_000_000 bytes and the GB cutoff at 1_000_000_000; below it the value is displayed as KB and floored
 * to an integer, so values like 999_500 render as `999 KB` rather than the
 * confusing rounded `1000 KB`.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1_000) return `${bytes} B`
  if (bytes < 1_000_000) return `${Math.floor(bytes / 1_000)} KB`
  if (bytes >= 1_000_000_000) return `${(bytes / 1e9).toFixed(1)} GB`
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}
