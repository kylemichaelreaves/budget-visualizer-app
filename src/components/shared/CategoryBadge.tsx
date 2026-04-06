import type { JSX } from 'solid-js'
import { Badge } from '@components/ui/badge'

/** Extract the leaf category name from a path like "Food - Groceries" → "Groceries". */
function leafName(categoryPath: string): string {
  return categoryPath.includes(' - ') ? categoryPath.split(' - ').pop()! : categoryPath
}

/** Convert a hex or rgb() color string to rgba() with the given alpha. */
function withAlpha(cssColor: string, alpha: number): string {
  // #rrggbb
  const hex = cssColor.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (hex) {
    const [, r, g, b] = hex
    return `rgba(${parseInt(r!, 16)}, ${parseInt(g!, 16)}, ${parseInt(b!, 16)}, ${alpha})`
  }
  // rgb(r, g, b) → rgba(r, g, b, alpha)
  const rgb = cssColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
  if (rgb) {
    const [, r, g, b] = rgb
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return cssColor
}

export default function CategoryBadge(props: {
  category: string
  getColorByName: (name: string) => string
  dataTestId?: string
  children?: JSX.Element
}): JSX.Element {
  const color = () => props.getColorByName(leafName(props.category))

  return (
    <Badge
      variant="outline"
      class="text-xs hover:opacity-80 transition-colors"
      data-testid={props.dataTestId}
      style={{
        'border-color': color(),
        color: color(),
        'background-color': color() !== '#999999' ? withAlpha(color(), 0.08) : undefined,
      }}
    >
      {props.children ?? props.category}
    </Badge>
  )
}
