/**
 * The hover tooltip shared by the line chart, treemap and sunburst: a bold
 * title over one detail line, positioned inside its `absolute` offset parent.
 *
 * Content goes in as text nodes, never markup — titles are category and memo
 * names, which are user data.
 */

/** Tailwind classes for the tooltip element; it starts hidden. */
export const CHART_TOOLTIP_CLASS =
  'pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg opacity-0 transition-opacity'

/** Pixel offset from the pointer, so the tooltip never sits under the cursor. */
const POINTER_OFFSET = { x: 12, y: -12 }

export function setChartTooltipContent(el: HTMLElement, title: string, detail: string): void {
  el.textContent = ''
  const strong = document.createElement('strong')
  strong.textContent = title
  el.append(strong, document.createElement('br'), document.createTextNode(detail))
}

/** Place the tooltip at `(left, top)` px within its offset parent and show it. */
export function showChartTooltipAt(el: HTMLElement, left: number, top: number): void {
  el.style.left = `${left}px`
  el.style.top = `${top}px`
  el.style.opacity = '1'
}

/** Follow the pointer. `fallbackAnchor` is used when the tooltip has no offset parent yet. */
export function moveChartTooltipToPointer(
  el: HTMLElement,
  event: MouseEvent,
  fallbackAnchor?: Element | null,
): void {
  const anchor = el.offsetParent ?? fallbackAnchor
  if (!anchor) return
  const rect = anchor.getBoundingClientRect()
  showChartTooltipAt(
    el,
    event.clientX - rect.left + POINTER_OFFSET.x,
    event.clientY - rect.top + POINTER_OFFSET.y,
  )
}

/**
 * Hide the tooltip. Call it on `mouseleave`, and also before a chart rebuilds
 * its SVG and on unmount: an element removed under the cursor never fires
 * `mouseleave`, so without this the tooltip would stay stuck on screen.
 */
export function hideChartTooltip(el: HTMLElement | undefined): void {
  if (el) el.style.opacity = '0'
}
