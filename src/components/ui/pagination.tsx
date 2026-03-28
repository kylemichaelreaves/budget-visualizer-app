import { type JSX, splitProps } from 'solid-js'
import { cn } from '@utils/cn'
import { buttonVariants } from './button'

function Pagination(props: JSX.HTMLAttributes<HTMLElement> & { class?: string }) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      class={cn('mx-auto flex w-full justify-center', local.class)}
      {...rest}
    />
  )
}

function PaginationContent(props: JSX.HTMLAttributes<HTMLUListElement> & { class?: string }) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ul
      data-slot="pagination-content"
      class={cn('flex flex-row items-center gap-1', local.class)}
      {...rest}
    />
  )
}

function PaginationItem(props: JSX.LiHTMLAttributes<HTMLLIElement>) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = JSX.AnchorHTMLAttributes<HTMLAnchorElement> & {
  class?: string
  isActive?: boolean
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

function PaginationLink(props: PaginationLinkProps) {
  const [local, rest] = splitProps(props, ['class', 'isActive', 'size'])
  return (
    <a
      aria-current={local.isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={local.isActive}
      class={cn(
        buttonVariants({
          variant: local.isActive ? 'outline' : 'ghost',
          size: local.size ?? 'icon',
        }),
        local.class,
      )}
      {...rest}
    />
  )
}

function PaginationPrevious(props: PaginationLinkProps) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      class={cn('gap-1 px-2.5 sm:pl-2.5', local.class)}
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
  const [local, rest] = splitProps(props, ['class'])
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      class={cn('gap-1 px-2.5 sm:pr-2.5', local.class)}
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
  const [local, rest] = splitProps(props, ['class'])
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      class={cn('flex size-9 items-center justify-center', local.class)}
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
