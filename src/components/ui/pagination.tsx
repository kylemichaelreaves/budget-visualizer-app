import { omit } from 'solid-js'
import { cn } from '@utils/cn'
import { buttonVariants } from './button'
import type { JSX } from '@solidjs/web'

function Pagination(props: JSX.HTMLAttributes<HTMLElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      class={cn('mx-auto flex w-full justify-center', props.class)}
      {...rest}
    />
  )
}

function PaginationContent(props: JSX.HTMLAttributes<HTMLUListElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <ul
      data-slot="pagination-content"
      class={cn('flex flex-row items-center gap-1', props.class)}
      {...rest}
    />
  )
}

function PaginationItem(props: JSX.LiHTMLAttributes<HTMLLIElement>) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  class?: string
  isActive?: boolean
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /**
   * Overrides the default styling. `isActive` still drives `aria-current`, so use
   * this when a control needs a particular look without claiming to be the
   * current page — e.g. outlined prev/next controls.
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

function PaginationLink(props: PaginationLinkProps) {
  const rest = omit(props, 'class', 'isActive', 'size', 'type', 'variant')
  return (
    <button
      {...rest}
      type={props.type ?? 'button'}
      aria-current={props.isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={props.isActive === undefined ? undefined : String(props.isActive)}
      class={cn(
        buttonVariants({
          variant: props.variant ?? (props.isActive ? 'outline' : 'ghost'),
          size: props.size ?? 'icon',
        }),
        props.class,
      )}
    />
  )
}

function PaginationPrevious(props: PaginationLinkProps) {
  const rest = omit(props, 'class')
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      class={cn('gap-1 px-2.5 sm:pl-2.5', props.class)}
      {...rest}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      <span class="hidden sm:block">Previous</span>
    </PaginationLink>
  )
}

function PaginationNext(props: PaginationLinkProps) {
  const rest = omit(props, 'class')
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      class={cn('gap-1 px-2.5 sm:pr-2.5', props.class)}
      {...rest}
    >
      <span class="hidden sm:block">Next</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </PaginationLink>
  )
}

function PaginationEllipsis(props: JSX.HTMLAttributes<HTMLSpanElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <span
      data-slot="pagination-ellipsis"
      class={cn('flex size-9 items-center justify-center', props.class)}
      {...rest}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
      <span class="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
