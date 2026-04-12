/** Debounce before prefetching all pages for client search (reduces request bursts while typing). */
export const MEMOS_SEARCH_PREFETCH_DEBOUNCE_MS = 400
/** Cap background fetches for client-side search so huge datasets cannot unbounded-prefetch. */
export const MEMOS_SEARCH_PREFETCH_MAX_PAGES = 48
