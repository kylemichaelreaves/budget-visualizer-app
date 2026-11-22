import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach } from 'vitest'

/**
 * Solid 2 applies writes on the next microtask, not synchronously. In a browser,
 * a click's DOM update lands before the next frame. In a test, the assertion on
 * the line after `fireEvent` runs first, so we flush after every fired event, the
 * same way Solid 1's synchronous event batching behaved.
 */
configure({
  eventWrapper: (cb) => {
    const result = cb()
    flush()
    return result
  },
})

// jsdom has no layout, so it leaves `scrollIntoView` unimplemented. Kobalte's
// listbox and tabs call it from effects, and in Solid 2 an uncaught error in an
// effect halts every reactive update in the page.
Element.prototype.scrollIntoView ??= function scrollIntoView() {}

afterEach(() => {
  cleanup()
})
