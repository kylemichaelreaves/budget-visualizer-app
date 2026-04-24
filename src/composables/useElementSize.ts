import { createSignal, onCleanup } from 'solid-js'

export type ElementSize = { w: number; h: number }

/**
 * Tracks the content box of a DOM element via {@link ResizeObserver}.
 * Call the returned ref setter from a `ref` callback whenever the element mounts or updates.
 */
export function useElementSize() {
  const [dims, setDims] = createSignal<ElementSize>({ w: 0, h: 0 })
  let detach: (() => void) | undefined

  function attachElement(el: HTMLElement | undefined) {
    detach?.()
    detach = undefined
    if (!el) return

    const apply = (cr: DOMRectReadOnly) => {
      setDims({ w: Math.floor(cr.width), h: Math.floor(cr.height) })
    }

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (cr) apply(cr)
    })
    ro.observe(el)
    queueMicrotask(() => {
      setDims({ w: Math.floor(el.clientWidth), h: Math.floor(el.clientHeight) })
    })
    detach = () => ro.disconnect()
  }

  onCleanup(() => {
    detach?.()
    detach = undefined
  })

  return [dims, attachElement] as const
}
