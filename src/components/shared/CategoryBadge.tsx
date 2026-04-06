import type { JSX } from 'solid-js'
import { Badge } from '@components/ui/badge'

/** Extract the leaf category name from a path like "Food - Groceries" → "Groceries". */
function leafName(categoryPath: string): string {
  return categoryPath.includes(' - ') ? categoryPath.split(' - ').pop()! : categoryPath
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
        'background-color': color() !== '#999999' ? `${color()}15` : undefined,
      }}
    >
      {props.children ?? props.category}
    </Badge>
  )
}
