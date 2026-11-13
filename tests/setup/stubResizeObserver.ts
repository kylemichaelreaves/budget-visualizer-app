/**
 * jsdom has no ResizeObserver. This stub reports a fixed content box as soon as
 * an element is observed, so size-gated charts (useElementSize) draw in tests.
 */
export function stubResizeObserver(size: { width: number; height: number } = { width: 600, height: 300 }) {
  const original = globalThis.ResizeObserver
  class FixedSizeResizeObserver {
    private readonly callback: ResizeObserverCallback
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }
    observe(target: Element) {
      const entry = { target, contentRect: { ...size } as DOMRectReadOnly } as ResizeObserverEntry
      this.callback([entry], this as unknown as ResizeObserver)
    }
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = FixedSizeResizeObserver as unknown as typeof ResizeObserver
  return () => {
    globalThis.ResizeObserver = original
  }
}
