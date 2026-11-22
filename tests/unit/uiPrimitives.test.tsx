import { render, screen } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'
import { Separator } from '@components/ui/separator'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@components/ui/pagination'

// Solid 2 writes `data-*` values as attributes: `false` removes one rather than
// writing "false", so these wrappers stringify the flags their styles match.

describe('Separator', () => {
  it('is a horizontal separator by default', () => {
    render(() => <Separator data-testid="sep" />)
    const sep = screen.getByTestId('sep')
    expect(sep).toHaveAttribute('role', 'separator')
    expect(sep).toHaveAttribute('aria-orientation', 'horizontal')
    expect(sep).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('drops the separator role when decorative', () => {
    render(() => <Separator data-testid="sep" orientation="vertical" decorative class="mx-2" />)
    const sep = screen.getByTestId('sep')
    expect(sep).toHaveAttribute('role', 'none')
    expect(sep).not.toHaveAttribute('aria-orientation')
    expect(sep).toHaveAttribute('data-orientation', 'vertical')
    expect(sep).toHaveClass('mx-2')
  })
})

describe('Pagination', () => {
  it('marks the active page and leaves data-active off when unset', () => {
    render(() => (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink isActive={false}>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink isActive>2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    ))
    expect(screen.getByText('1').closest('button')).toHaveAttribute('data-active', 'false')
    expect(screen.getByText('2').closest('button')).toHaveAttribute('data-active', 'true')
    expect(screen.getByText('2').closest('button')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('3').closest('button')).not.toHaveAttribute('data-active')
  })
})
