export interface SunburstArcCoords {
  x0: number
  x1: number
  y0: number
  y1: number
}

export const SUNBURST_SIZE = 400
export const SUNBURST_RADIUS = SUNBURST_SIZE / 6
export const SUNBURST_CX = SUNBURST_SIZE / 2
export const SUNBURST_CY = SUNBURST_SIZE / 2
export const SUNBURST_TRANSITION_MS = 750

export const sunburstArcVisible = (d: SunburstArcCoords) => d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0

export const sunburstLabelVisible = (d: SunburstArcCoords) =>
  d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03

export function sunburstLabelTransform(d: SunburstArcCoords): string {
  const x = ((d.x0 + d.x1) / 2) * (180 / Math.PI)
  const y = ((d.y0 + d.y1) / 2) * SUNBURST_RADIUS
  return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`
}
