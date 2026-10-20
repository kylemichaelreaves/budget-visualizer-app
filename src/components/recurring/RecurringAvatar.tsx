import { createMemo, createSignal, Show } from 'solid-js'

/**
 * Up to two characters to stand in for a memo: the first letters of its first two words, or the
 * first two letters of a single word. `memos.name` is nullable and free text, so a missing name,
 * whitespace or punctuation alone yields `?` rather than an empty circle. Matched by code point
 * (`\p{L}`/`\p{N}`, `Array.from`) so an astral character is never cut in half.
 */
export function memoInitials(memoName: string | null | undefined): string {
  const words = memoName?.match(/[\p{L}\p{N}]+/gu) ?? []
  const [first, second] = words.map((word) => Array.from(word))
  if (!first) return '?'
  const letters = second ? [first[0], second[0]] : first.slice(0, 2)
  return letters.join('').toUpperCase()
}

/**
 * A 28px circle showing a memo's initials on `--muted`.
 *
 * `memos.avatar_s3_url` currently answers 403 for every memo, so the initials are the designed
 * default, not a placeholder. An `<img>` is only attempted when a URL is set, it is laid over the
 * initials inside the same fixed-size circle, and it stays invisible until it has loaded. A failed
 * request removes the image and leaves the initials where they were: no broken-image icon and
 * no layout shift. Failure and success are keyed to the URL, so a new URL gets a fresh attempt.
 */
export default function RecurringAvatar(props: { memoName: string | null; avatarS3Url: string | null }) {
  const [failedUrl, setFailedUrl] = createSignal<string | null>(null)
  const [loadedUrl, setLoadedUrl] = createSignal<string | null>(null)

  const initials = createMemo(() => memoInitials(props.memoName))
  const showImage = () => !!props.avatarS3Url && failedUrl() !== props.avatarS3Url
  const imageLoaded = () => !!props.avatarS3Url && loadedUrl() === props.avatarS3Url

  return (
    <span
      data-testid="recurring-avatar"
      aria-hidden="true"
      class="bg-muted text-muted-foreground relative inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-medium select-none"
    >
      <Show when={!imageLoaded()}>{initials()}</Show>
      <Show when={showImage() ? props.avatarS3Url : null}>
        {(url) => (
          <img
            src={url()}
            alt=""
            class={
              imageLoaded()
                ? 'absolute inset-0 size-full object-cover'
                : 'absolute inset-0 size-full object-cover opacity-0'
            }
            onLoad={() => setLoadedUrl(url())}
            onError={() => setFailedUrl(url())}
          />
        )}
      </Show>
    </span>
  )
}
