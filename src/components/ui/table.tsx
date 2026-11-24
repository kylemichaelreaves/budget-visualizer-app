import { omit } from 'solid-js'
import { cn } from '@utils/cn'
import type { JSX } from '@solidjs/web'

function Table(props: JSX.HTMLAttributes<HTMLTableElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <div data-slot="table-container" class="relative w-full overflow-x-auto">
      <table data-slot="table" class={cn('w-full caption-bottom text-sm', props.class)} {...rest} />
    </div>
  )
}

function TableHeader(props: JSX.HTMLAttributes<HTMLTableSectionElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return <thead data-slot="table-header" class={cn('[&_tr]:border-b', props.class)} {...rest} />
}

function TableBody(props: JSX.HTMLAttributes<HTMLTableSectionElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return <tbody data-slot="table-body" class={cn('[&_tr:last-child]:border-0', props.class)} {...rest} />
}

function TableFooter(props: JSX.HTMLAttributes<HTMLTableSectionElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <tfoot
      data-slot="table-footer"
      class={cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', props.class)}
      {...rest}
    />
  )
}

function TableRow(props: JSX.HTMLAttributes<HTMLTableRowElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <tr
      data-slot="table-row"
      class={cn('hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors', props.class)}
      {...rest}
    />
  )
}

function TableHead(props: JSX.ThHTMLAttributes<HTMLTableCellElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <th
      data-slot="table-head"
      class={cn(
        'text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        props.class,
      )}
      {...rest}
    />
  )
}

function TableCell(props: JSX.TdHTMLAttributes<HTMLTableCellElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <td
      data-slot="table-cell"
      class={cn(
        'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        props.class,
      )}
      {...rest}
    />
  )
}

function TableCaption(props: JSX.HTMLAttributes<HTMLTableCaptionElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <caption
      data-slot="table-caption"
      class={cn('text-muted-foreground mt-4 text-sm', props.class)}
      {...rest}
    />
  )
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
